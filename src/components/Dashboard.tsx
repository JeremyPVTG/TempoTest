import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarIcon,
  CheckCircle,
  CheckCircle2,
  Crown,
  Flame,
  Medal,
  Star,
  Trophy,
  TrendingUp,
} from "lucide-react";

interface HabitStreak {
  id: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  icon: React.ReactNode;
  color: string;
}

interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  xpReward: number;
  category: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
}

interface DashboardProps {
  username?: string;
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  habits?: HabitStreak[];
  dailyTasks?: DailyTask[];
  achievements?: Achievement[];
}

const Dashboard = ({
  username = "User",
  level = 5,
  xp = 350,
  xpToNextLevel = 500,
  habits = [
    {
      id: "1",
      name: "Morning Meditation",
      currentStreak: 7,
      longestStreak: 14,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      id: "2",
      name: "Daily Exercise",
      currentStreak: 3,
      longestStreak: 21,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-green-500",
    },
    {
      id: "3",
      name: "Reading",
      currentStreak: 12,
      longestStreak: 30,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "bg-purple-500",
    },
    {
      id: "4",
      name: "Drink Water",
      currentStreak: 5,
      longestStreak: 15,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-cyan-500",
    },
  ],
  dailyTasks = [
    {
      id: "1",
      title: "Complete 10 minutes meditation",
      completed: true,
      xpReward: 20,
      category: "Wellness",
    },
    {
      id: "2",
      title: "Go for a 30 minute walk",
      completed: false,
      xpReward: 30,
      category: "Fitness",
    },
    {
      id: "3",
      title: "Read 20 pages",
      completed: false,
      xpReward: 25,
      category: "Learning",
    },
    {
      id: "4",
      title: "Practice gratitude journaling",
      completed: false,
      xpReward: 15,
      category: "Mindfulness",
    },
    {
      id: "5",
      title: "Drink 8 glasses of water",
      completed: true,
      xpReward: 10,
      category: "Health",
    },
  ],
  achievements = [
    {
      id: "1",
      title: "Early Bird",
      description: "Complete morning routine for 7 days",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      unlocked: true,
      progress: 100,
    },
    {
      id: "2",
      title: "Fitness Fanatic",
      description: "Exercise for 10 days straight",
      icon: <Trophy className="h-6 w-6 text-amber-500" />,
      unlocked: false,
      progress: 30,
    },
    {
      id: "3",
      title: "Bookworm",
      description: "Read for 30 days total",
      icon: <Medal className="h-6 w-6 text-blue-500" />,
      unlocked: false,
      progress: 60,
    },
    {
      id: "4",
      title: "Consistency King",
      description: "Maintain any habit for 21 days",
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      unlocked: false,
      progress: 80,
    },
  ],
}: DashboardProps) => {
  const xpProgress = (xp / xpToNextLevel) * 100;

  return (
    <div className="bg-background p-4 md:p-6 w-full max-w-7xl mx-auto">
      {/* User Profile and Level */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt={username}
            />
            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{username}</h2>
            <div className="text-sm text-muted-foreground">
              Level {level} Explorer
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-medium">7 Day Streak</span>
        </div>
      </div>

      {/* XP Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">Level Progress</div>
            <div className="text-sm text-muted-foreground">
              {xp}/{xpToNextLevel} XP
            </div>
          </div>
          <Progress value={xpProgress} className="h-3" />
          <div className="mt-2 text-xs text-muted-foreground text-right">
            {Math.round(xpProgress)}% to Level {level + 1}
          </div>
        </CardContent>
      </Card>

      {/* Habit Streaks */}
      <h3 className="text-lg font-semibold mb-3">Habit Streaks</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {habits.map((habit) => (
          <Card key={habit.id} className="overflow-hidden">
            <div className={`h-1 ${habit.color}`}></div>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-full ${habit.color} bg-opacity-20 text-foreground`}
                  >
                    {habit.icon}
                  </div>
                  <span className="font-medium">{habit.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-bold">{habit.currentStreak}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Longest streak: {habit.longestStreak} days
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Tasks */}
      <h3 className="text-lg font-semibold mb-3">Today's Tasks</h3>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {dailyTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox id={`task-${task.id}`} checked={task.completed} />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-medium">
                    {task.xpReward} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-center text-muted-foreground">
            {dailyTasks.filter((task) => task.completed).length} of{" "}
            {dailyTasks.length} tasks completed
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <h3 className="text-lg font-semibold mb-3">Achievements</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`${!achievement.unlocked ? "opacity-70" : ""}`}
          >
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-2">{achievement.icon}</div>
              <h4 className="font-medium text-sm">{achievement.title}</h4>
              <div className="mt-2 mb-3">
                <Progress value={achievement.progress} className="h-1" />
              </div>
              <p className="text-xs text-muted-foreground">
                {achievement.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
