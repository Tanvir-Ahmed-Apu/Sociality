import { Tabs, TabList, Tab, Divider, Box } from "@chakra-ui/react";

interface ProfileTabsProps {
    selectedTab: string;
    onTabChange: (tab: string) => void;
    isOwnProfile: boolean;
}

export const ProfileTabs = ({ selectedTab, onTabChange, isOwnProfile }: ProfileTabsProps) => {
    const tabNameToIndex: Record<string, number> = {
        posts: 0,
        replies: 1,
        reposts: 2,
    };

    const tabIndexToName: Record<number, string> = {
        0: "posts",
        1: "replies",
        2: "reposts",
    };

    const handleTabChange = (index: number) => {
        onTabChange(tabIndexToName[index]);
    };

    const tabStyles = {
        borderRadius: "md",
        bg: "rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        px: 6,
        py: 2,
        transition: "all 0.3s ease",
        border: "none",
        outline: "none",
        borderWidth: 0,
        borderStyle: "none" as const,
        _selected: {
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.25)",
            border: "none",
            borderWidth: 0
        },
        _hover: {
            bg: "rgba(0, 179, 116, 0.1)",
            boxShadow: "0 4px 15px rgba(0, 179, 116, 0.15)",
            border: "none",
            borderWidth: 0
        },
        _focus: {
            border: "none",
            outline: "none",
            borderWidth: 0
        }
    };

    return (
        <>
            <Tabs
                index={tabNameToIndex[selectedTab]}
                onChange={handleTabChange}
                variant='unstyled'
                w="full"
                border="none"
                style={{ border: "none" }}
                className="no-border-tabs"
            >
                <TabList justifyContent="space-around" border="none" style={{ border: "none" }} className="no-border-tablist">
                    <Tab as="div" {...tabStyles} className="glass-tab no-border-tab">Posts</Tab>
                    <Tab as="div" {...tabStyles} className="glass-tab no-border-tab">Replies</Tab>
                    <Tab as="div" {...tabStyles} className="glass-tab no-border-tab">Reposts</Tab>
                </TabList>
            </Tabs>

            {isOwnProfile && <Box h="16px" />}
        </>
    );
};
