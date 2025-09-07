import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  ChevronRight,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: Date;
}

interface Plan {
  id: string;
  title: string;
  description: string;
  milestones: Milestone[];
}

const AICoach = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi there! I'm your AI Coach. What goal would you like to work on today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [showPlan, setShowPlan] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, newUserMessage]);
    setInputValue("");

    // Simulate AI response with a plan
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I've analyzed your goal and created a milestone plan. Would you like to see it?",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Create a sample plan based on user input
      const samplePlan: Plan = {
        id: "plan-1",
        title: `Plan for: ${newUserMessage.content}`,
        description:
          "Here's a structured approach to help you achieve your goal.",
        milestones: [
          {
            id: "m1",
            title: "Research and Preparation",
            description:
              "Gather information and resources needed for your goal.",
            completed: false,
          },
          {
            id: "m2",
            title: "First Steps",
            description: "Take initial actions to build momentum.",
            completed: false,
          },
          {
            id: "m3",
            title: "Building Consistency",
            description: "Establish regular habits that support your goal.",
            completed: false,
          },
          {
            id: "m4",
            title: "Overcoming Challenges",
            description:
              "Identify potential obstacles and strategies to overcome them.",
            completed: false,
          },
          {
            id: "m5",
            title: "Final Achievement",
            description: "Complete the necessary steps to reach your goal.",
            completed: false,
          },
        ],
      };

      setCurrentPlan(samplePlan);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAcceptPlan = () => {
    const acceptMessage: Message = {
      id: Date.now().toString(),
      content: "I accept this plan.",
      sender: "user",
      timestamp: new Date(),
    };

    const aiConfirmation: Message = {
      id: (Date.now() + 1).toString(),
      content:
        "Great! I've added these milestones to your habit tracking system. You can view your progress anytime.",
      sender: "ai",
      timestamp: new Date(),
    };

    setMessages([...messages, acceptMessage, aiConfirmation]);
    setShowPlan(false);
  };

  const handleModifyPlan = () => {
    setShowPlan(false);
    setInputValue("I'd like to modify the plan by...");
  };

  return (
    <div className="bg-background w-full h-full flex flex-col p-4 md:p-6">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=coach" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>AI Coach</CardTitle>
                <CardDescription>
                  Your personal milestone planner
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles size={14} />
              <span>Smart Planning</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-[calc(100%-2rem)] pr-4">
            <div className="flex flex-col gap-4 pb-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    <p>{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {currentPlan && showPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 border rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{currentPlan.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlan(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {currentPlan.description}
              </p>

              <div className="space-y-3">
                {currentPlan.milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50"
                  >
                    <div className="bg-primary/10 rounded-full p-1 text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">{milestone.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    </div>
                    <CheckCircle
                      size={18}
                      className="text-muted-foreground/50"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleModifyPlan}>
                  Modify Plan
                </Button>
                <Button onClick={handleAcceptPlan}>Accept Plan</Button>
              </div>
            </motion.div>
          )}

          {currentPlan && !showPlan && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setShowPlan(true)}
              >
                <MessageSquare size={16} />
                View Milestone Plan
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-4 border-t">
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your goal or question here..."
              className="flex-grow min-h-[60px] max-h-[120px]"
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim()}>
              <Send size={18} />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AICoach;
