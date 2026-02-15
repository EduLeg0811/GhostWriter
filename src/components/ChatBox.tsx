import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatBoxProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const ChatBox = ({ onSend, isLoading }: ChatBoxProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-muted/20 p-3">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte algo sobre o texto ou dê uma instrução..."
          className="min-h-[44px] max-h-[120px] resize-none text-sm"
          rows={1}
        />
        <Button size="icon" className="h-[44px] w-[44px] shrink-0 bg-green-200 hover:bg-green-300 text-green-800" onClick={handleSend} disabled={!message.trim() || isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default ChatBox;
