export interface Achievement {
    id: string;
    title: string;
    description: string;
    type: 'first_complete' | 'streak_3' | 'streak_7' | 'streak_30' | 'weekly_goal' | 'monthly_goal' | 'perfect_week' | 'comeback';
}
export interface AchievementEvent {
    habit_id: string;
    occurred_at: string;
    event_type: 'mark_done' | 'undo';
}
export interface EvaluationResult {
    new: Achievement[];
    existing: Achievement[];
}
export declare const achievementRules: {
    evaluate(state: any, event?: AchievementEvent): EvaluationResult;
};
export declare function makeIdempotencyKey(): string;
