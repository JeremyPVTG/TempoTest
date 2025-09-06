import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Award,
  TrendingUp,
  Star,
  Trophy,
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  progress: number;
  dueDate: string;
  completed: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  date?: string;
}

interface HabitStreak {
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  lastWeek: boolean[];
}

const ProgressVisualization = () => {
  const [activeTab, setActiveTab] = useState("streaks");

  // Mock data for habit streaks
  const habitStreaks: HabitStreak[] = [
    {
      habitName: "Morning Meditation",
      currentStreak: 7,
      longestStreak: 14,
      completionRate: 85,
      lastWeek: [true, true, true, true, false, true, true],
    },
    {
      habitName: "Daily Exercise",
      currentStreak: 3,
      longestStreak: 21,
      completionRate: 70,
      lastWeek: [true, false, true, false, true, false, true],
    },
    {
      habitName: "Reading",
      currentStreak: 12,
      longestStreak: 30,
      completionRate: 92,
      lastWeek: [true, true, true, true, true, true, true],
    },
  ];

  // Mock data for milestones
  const milestones: Milestone[] = [
    {
      id: "1",
      title: "Run 5K without stopping",
      progress: 80,
      dueDate: "2023-06-15",
      completed: false,
    },
    {
      id: "2",
      title: "Meditate for 30 days straight",
      progress: 100,
      dueDate: "2023-05-30",
      completed: true,
    },
    {
      id: "3",
      title: "Read 10 books this year",
      progress: 40,
      dueDate: "2023-12-31",
      completed: false,
    },
  ];

  // Mock data for achievements
  const achievements: Achievement[] = [
    {
      id: "1",
      title: "Early Bird",
      description: "Complete morning routine for 7 days straight",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      unlocked: true,
      date: "2023-05-10",
    },
    {
      id: "2",
      title: "Bookworm",
      description: "Read for 30 minutes every day for 2 weeks",
      icon: <Trophy className="h-6 w-6 text-amber-500" />,
      unlocked: true,
      date: "2023-05-15",
    },
    {
      id: "3",
      title: "Fitness Fanatic",
      description: "Exercise 5 times a week for a month",
      icon: <Award className="h-6 w-6 text-blue-500" />,
      unlocked: false,
    },
  ];

  // Animation variants for celebration effects
  const celebrationVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
  };

  return (
    <div className="w-full p-4 bg-background">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Your Progress Journey
      </h2>

      <Tabs
        defaultValue="streaks"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="streaks" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Habit Streaks</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Milestones</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streaks" className="space-y-4">
          {habitStreaks.map((habit, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{habit.habitName}</CardTitle>
                  <Badge
                    variant={habit.currentStreak > 5 ? "default" : "secondary"}
                  >
                    {habit.currentStreak} day streak
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completion Rate</span>
                    <span>{habit.completionRate}%</span>
                  </div>
                  <Progress value={habit.completionRate} className="h-2" />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {habit.lastWeek.map((completed, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Longest: {habit.longestStreak} days
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end justify-between gap-2">
                {[65, 40, 75, 80, 90, 60, 85].map((value, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col items-center"
                  >
                    <div
                      className="w-8 bg-primary rounded-t-md"
                      style={{ height: `${value}%` }}
                    />
                    <span className="text-xs mt-1">
                      {["M", "T", "W", "T", "F", "S", "S"][index]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-500">
                  15% improvement from last week
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          {milestones.map((milestone) => (
            <motion.div
              key={milestone.id}
              initial="hidden"
              animate={milestone.completed ? "visible" : "hidden"}
              variants={celebrationVariants}
            >
              <Card
                className={
                  milestone.completed ? "border-green-500 shadow-md" : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      {milestone.completed && (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      )}
                      {milestone.title}
                    </CardTitle>
                    <Badge
                      variant={milestone.completed ? "default" : "outline"}
                    >
                      {milestone.completed
                        ? "Completed"
                        : `Due ${new Date(milestone.dueDate).toLocaleDateString()}`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{milestone.progress}%</span>
                    </div>
                    <Progress
                      value={milestone.progress}
                      className={`h-2 ${milestone.completed ? "bg-green-100" : ""}`}
                    />
                  </div>

                  {milestone.completed && (
                    <motion.div
                      className="mt-4 p-2 bg-green-50 rounded-md text-green-700 text-sm flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Congratulations on completing this milestone!
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent
          value="achievements"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial="hidden"
              animate={achievement.unlocked ? "visible" : "hidden"}
              variants={celebrationVariants}
            >
              <Card
                className={
                  achievement.unlocked ? "border-amber-500" : "opacity-70"
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full ${achievement.unlocked ? "bg-amber-100" : "bg-gray-100"}`}
                    >
                      {achievement.icon}
                    </div>
                    <div>
                      <h3 className="font-bold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      {achievement.unlocked && achievement.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlocked on{" "}
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <Card className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-center">
                Your Achievement Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {achievements.filter((a) => a.unlocked).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Unlocked</div>
                </div>
                <div className="h-12 w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {achievements.length -
                      achievements.filter((a) => a.unlocked).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
                <div className="h-12 w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(
                      (achievements.filter((a) => a.unlocked).length /
                        achievements.length) *
                        100,
                    )}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressVisualization;
