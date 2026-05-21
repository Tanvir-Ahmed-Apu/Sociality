export interface MessageProps {
  ownMessage: boolean;
  message: any;
  onDelete: (id: string, forEveryone: boolean) => void;
  onStar?: (id: string) => void;
}
