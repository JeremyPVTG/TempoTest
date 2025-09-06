import React from "react";
import { motion, MotionConfig } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Dashboard from "./Dashboard";
import AICoach from "./AICoach";
import ProgressVisualization from "./ProgressVisualization";
import { Bell, Gift, User } from "lucide-react";

const Home = () => {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-gradient-to-b from-background to-background/90 p-4 md:p-6">
        <header className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center"
          >
            <h1 className="text-2xl font-bold text-primary">HabitQuest</h1>
            <div className="ml-4 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
              Level 7
            </div>
          </motion.div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-accent">
              <Bell size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-accent">
              <Gift size={20} />
            </button>
            <button className="p-2 rounded-full bg-primary/10 hover:bg-primary/20">
              <User size={20} />
            </button>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Daily Progress</h2>
                  <p className="text-sm text-muted-foreground">
                    4/7 tasks completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">57% Complete</p>
                  <p className="text-xs text-muted-foreground">+120 XP today</p>
                </div>
              </div>
              <div className="mt-3 h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "57%" }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="coach">AI Coach</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard />
          </TabsContent>

          <TabsContent value="coach" className="mt-0">
            <AICoach />
          </TabsContent>

          <TabsContent value="progress" className="mt-0">
            <ProgressVisualization />
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t"
        >
          <div className="flex justify-between max-w-md mx-auto">
            <button className="flex flex-col items-center p-2 text-primary">
              <span className="text-xs font-medium">Home</span>
            </button>
            <button className="flex flex-col items-center p-2">
              <span className="text-xs font-medium">Habits</span>
            </button>
            <button className="flex flex-col items-center p-2 bg-primary text-primary-foreground rounded-full px-6">
              <span className="text-xs font-medium">+ Add</span>
            </button>
            <button className="flex flex-col items-center p-2">
              <span className="text-xs font-medium">Stats</span>
            </button>
            <button className="flex flex-col items-center p-2">
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </motion.div>
      </div>
    </MotionConfig>
  );
};

export default Home;
