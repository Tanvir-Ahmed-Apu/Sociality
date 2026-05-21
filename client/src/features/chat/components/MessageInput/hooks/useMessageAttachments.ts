import { useState, useCallback, useRef } from "react";
import usePreviewImg from "../../../../../hooks/usePreviewImg";
import useShowToast from "../../../../../hooks/useShowToast";

export const useMessageAttachments = () => {
    const showToast = useShowToast();
    const { handleImageChange, imgUrl, clearImages } = usePreviewImg();
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<any>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachMenuRef = useRef<HTMLDivElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            showToast("Error", "File size must be less than 50MB", "error");
            return;
        }

        setSelectedFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                setFilePreview({
                    type: 'image',
                    url: e.target?.result,
                    name: file.name,
                    size: file.size
                });
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview({
                type: 'file',
                name: file.name,
                size: file.size,
                extension: file.name.split('.').pop()?.toUpperCase() || 'FILE'
            });
        }
    }, [showToast]);

    const handleFileAttachment = useCallback((closeAttachMenu: () => void) => {
        closeAttachMenu();
        fileInputRef.current?.click();
    }, []);

    const handleImageAttachment = useCallback((closeAttachMenu: () => void) => {
        closeAttachMenu();
        imageInputRef.current?.click();
    }, []);

    const clearFileSelection = useCallback(() => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return {
        selectedFile,
        filePreview,
        fileInputRef,
        imageInputRef,
        attachMenuRef,
        handleFileChange,
        handleFileAttachment,
        handleImageAttachment,
        clearFileSelection,
        imgUrl,
        handleImageChange,
        clearImages
    };
};
