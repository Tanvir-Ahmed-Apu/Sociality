import { useState, useRef, useCallback } from "react";
import { fetchWithSession } from "../../../../../utils/api";
import useShowToast from "../../../../../hooks/useShowToast";

export const useMessageSender = ({
    selectedConversation,
    currentUser,
    setMessages,
    setConversations,
    messageText,
    setMessageText,
    imgUrl,
    clearImages,
    selectedEmoji,
    setSelectedEmoji,
    selectedFile,
    clearFileSelection,
    fileInputRef
}: any) => {
    const showToast = useShowToast();
    const [isSending, setIsSending] = useState(false);
    const isSendingRef = useRef(false);

    const sendRequestFn = async (formData: FormData | null, messageData: any) => {
        let responseData = null;

        if (selectedConversation.isFederated) {
            let response;
            if (formData) {
                formData.append("message", messageData.text || "");
                response = await fetchWithSession("/api/cross-platform/rooms/" + selectedConversation._id + "/messages", {
                    method: "POST",
                    body: formData,
                });
            } else {
                response = await fetchWithSession("/api/cross-platform/rooms/" + selectedConversation._id + "/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ message: messageData.text }),
                });
            }
            responseData = await response.json();

            if (responseData.success && responseData.localMessage) {
                return {
                    _id: responseData.localMessage.id,
                    text: responseData.localMessage.text,
                    img: responseData.localMessage.img,
                    file: responseData.localMessage.file,
                    fileName: responseData.localMessage.fileName,
                    fileSize: responseData.localMessage.fileSize,
                    attachmentType: responseData.localMessage.attachmentType,
                    sender: responseData.localMessage.sender._id,
                    senderUsername: responseData.localMessage.sender.username,
                    senderPlatform: responseData.localMessage.sender.platform,
                    createdAt: responseData.localMessage.timestamp,
                    isFederated: true,
                    platform: responseData.localMessage.platform,
                    tempId: messageData.tempId
                };
            }
        } else {
            if (formData) {
                const response = await fetchWithSession("/api/messages", {
                    method: "POST",
                    body: formData,
                });
                responseData = await response.json();
            } else {
                const response = await fetchWithSession("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(messageData),
                });
                responseData = await response.json();
            }
        }

        return responseData;
    };

    const messageAlreadyUpdated = (prev: any[], tempId: string, responseData: any) => {
        return prev.some(msg =>
            (msg.tempId === tempId && !msg.isOptimistic) ||
            (responseData._id && msg._id === responseData._id)
        );
    };

    const handleSendMessage = useCallback(async (e?: React.FormEvent | { preventDefault: () => void }) => {
        e?.preventDefault();
        
        if (isSendingRef.current) return;
        if (!messageText.trim() && !imgUrl && !selectedEmoji && !selectedFile) return;

        isSendingRef.current = true;
        setIsSending(true);

        try {
            const tempId = Date.now().toString();
            let formData = null;
            let messageData = {
                tempId,
                text: messageText,
                recipientId: selectedConversation.userId,
                img: imgUrl || undefined,
                emoji: selectedEmoji || undefined,
            };

            if (selectedConversation.isFederated && selectedEmoji) {
                showToast("Info", "Emojis are not supported in cross-platform rooms yet", "info");
                setIsSending(false);
                return;
            }

            if (imgUrl || selectedFile) {
                formData = new FormData();
                formData.append("text", messageText);
                if (selectedConversation.userId) formData.append("recipientId", selectedConversation.userId);
                formData.append("tempId", tempId);

                if (imgUrl) {
                    const url = imgUrl as string;
                    if (url.startsWith("blob:") || url.startsWith("data:")) {
                        const response = await fetch(url);
                        const imgBlob = await response.blob();
                        formData.append("img", imgBlob, "image.png");
                    } else {
                        formData.append("img", imgUrl as any);
                    }
                }

                if (selectedFile) {
                    formData.append("file", selectedFile);
                    formData.append("fileName", selectedFile.name);
                    formData.append("fileSize", String(selectedFile.size));
                }

                if (selectedEmoji) {
                    formData.append("emoji", selectedEmoji);
                }
            }

            const displayText = messageText ||
                (selectedFile ? `📎 ${selectedFile.name}` : '') ||
                (imgUrl ? '' : '') ||
                (selectedEmoji ? selectedEmoji : '');

            const optimisticMessage = selectedConversation.isFederated ? {
                _id: tempId,
                text: displayText,
                img: imgUrl || undefined,
                file: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
                fileName: selectedFile?.name || undefined,
                fileSize: selectedFile?.size || undefined,
                attachmentType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'document') : (imgUrl ? 'image' : 'none'),
                sender: currentUser?._id || "",
                senderUsername: currentUser?.name || currentUser?.username || "",
                senderPlatform: 'sociality',
                createdAt: new Date().toISOString(),
                isOptimistic: true,
                isNew: true,
                isFederated: true,
                platform: 'sociality',
                tempId
            } : {
                text: displayText,
                sender: currentUser?._id || "",
                tempId,
                createdAt: new Date().toISOString(),
                isOptimistic: true,
                isNew: true,
                img: imgUrl || undefined,
                emoji: selectedEmoji || undefined,
                file: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
                fileName: selectedFile?.name || undefined,
                fileSize: selectedFile?.size || undefined,
            };

            setMessages((prev: any) => [...prev, optimisticMessage]);

            setConversations((prev: any) => {
                const updatedConversations = [...prev];
                const conversationIndex = updatedConversations.findIndex((c: any) => c._id === selectedConversation._id);
                if (conversationIndex !== -1) {
                    updatedConversations[conversationIndex] = {
                        ...updatedConversations[conversationIndex],
                        lastMessage: {
                            text: displayText,
                            sender: currentUser?._id || "",
                            img: imgUrl ? "true" : undefined,
                            emoji: selectedEmoji || undefined,
                            file: selectedFile ? "true" : undefined,
                            fileName: selectedFile?.name || undefined,
                            createdAt: new Date().toISOString(),
                        },
                        updatedAt: new Date().toISOString(),
                    };
                    const conversation = updatedConversations.splice(conversationIndex, 1)[0];
                    updatedConversations.unshift(conversation);
                }
                return updatedConversations;
            });

            const forceImmediateScroll = () => {
                const messageContainer = document.getElementById('messageListContainer');
                if (messageContainer) {
                    messageContainer.scrollTop = messageContainer.scrollHeight;
                }
            };

            setTimeout(forceImmediateScroll, 10);
            setTimeout(forceImmediateScroll, 50);
            setTimeout(forceImmediateScroll, 100);

            try {
                const responseData = await sendRequestFn(formData, messageData);
                setMessages((prev: any) => {
                    if (messageAlreadyUpdated(prev, tempId, responseData)) return prev;
                    return prev.map((msg: any) =>
                        msg.tempId === tempId ? { ...responseData, isNew: true } : msg
                    );
                });
            } catch (error: any) {
                showToast("Error", error.message, "error");
            }

            document.getElementById('messageInput')?.blur();
            
            setMessageText("");
            clearImages();
            setSelectedEmoji("");
            clearFileSelection();

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error: any) {
            showToast("Error", error.message, "error");
        } finally {
            isSendingRef.current = false;
            setIsSending(false);
        }
    }, [
        messageText,
        imgUrl,
        selectedEmoji,
        selectedFile,
        selectedConversation?.userId,
        selectedConversation?.isFederated,
        selectedConversation?._id,
        currentUser?._id,
        setMessages,
        showToast,
        clearImages,
        setConversations,
        clearFileSelection,
        fileInputRef,
        setMessageText,
        setSelectedEmoji
    ]);

    return {
        handleSendMessage,
        isSending
    };
};
