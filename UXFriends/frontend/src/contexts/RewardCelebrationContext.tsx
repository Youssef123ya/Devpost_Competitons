import {
  Award,
  BookOpen,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RewardProgressSnapshot } from "../utils/rewards";

type RewardKind =
  | "lesson"
  | "quiz"
  | "challenge"
  | "project"
  | "revision"
  | "badge"
  | "league"
  | "goal";

export interface RewardCelebrationInput {
  kind: RewardKind;
  xp: number;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  from: RewardProgressSnapshot;
  to: RewardProgressSnapshot;
}

interface RewardCelebrationContextValue {
  queueReward: (reward: RewardCelebrationInput) => void;
  queueRewards: (rewards: RewardCelebrationInput[]) => void;
}

interface QueuedReward extends RewardCelebrationInput {
  id: string;
  dedupeKey: string;
}

const RewardCelebrationContext =
  createContext<RewardCelebrationContextValue | null>(null);

const AUTO_CLOSE_MS = 3200;
const DUPLICATE_REWARD_WINDOW_MS = 10000;

function getProgressPercent(snapshot: RewardProgressSnapshot) {
  return Math.max(
    0,
    Math.min(100, (snapshot.currentXP / Math.max(snapshot.nextLevelXP, 1)) * 100),
  );
}

function buildRewardDedupeKey(reward: RewardCelebrationInput) {
  return [
    reward.kind,
    reward.xp,
    reward.titleAr,
    reward.titleEn,
    reward.subtitleAr ?? "",
    reward.subtitleEn ?? "",
    reward.from.level,
    reward.from.currentXP,
    reward.from.nextLevelXP,
    reward.to.level,
    reward.to.currentXP,
    reward.to.nextLevelXP,
  ].join("|");
}

function RewardIcon({ kind }: { kind: RewardKind }) {
  switch (kind) {
    case "lesson":
      return <BookOpen className="h-8 w-8" />;
    case "quiz":
      return <Target className="h-8 w-8" />;
    case "challenge":
      return <Trophy className="h-8 w-8" />;
    case "project":
      return <Award className="h-8 w-8" />;
    case "revision":
      return <Sparkles className="h-8 w-8" />;
    case "badge":
      return <Award className="h-8 w-8" />;
    case "league":
      return <Trophy className="h-8 w-8" />;
    case "goal":
      return <Target className="h-8 w-8" />;
    default:
      return <Zap className="h-8 w-8" />;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRewardCelebration() {
  const context = useContext(RewardCelebrationContext);
  if (!context) {
    throw new Error(
      "useRewardCelebration must be used within RewardCelebrationProvider",
    );
  }

  return context;
}

export function RewardCelebrationProvider({
  children,
  language = "ar",
}: {
  children: ReactNode;
  language?: "ar" | "en";
}) {
  const [activeReward, setActiveReward] = useState<QueuedReward | null>(null);
  const [visible, setVisible] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [barPercent, setBarPercent] = useState(0);
  const queueRef = useRef<QueuedReward[]>([]);
  const activeRewardRef = useRef<QueuedReward | null>(null);
  const activeOrQueuedKeysRef = useRef<Set<string>>(new Set());
  const recentlyShownKeysRef = useRef<Map<string, number>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const phaseTwoTimeoutRef = useRef<number | null>(null);
  const autoCloseTimeoutRef = useRef<number | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const dismissActiveRewardRef = useRef<() => void>(() => {});
  const openNextRewardRef = useRef<() => void>(() => {});

  const clearTimers = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (phaseTwoTimeoutRef.current !== null) {
      window.clearTimeout(phaseTwoTimeoutRef.current);
      phaseTwoTimeoutRef.current = null;
    }

    if (autoCloseTimeoutRef.current !== null) {
      window.clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }

    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const pruneRecentRewardKeys = useCallback((now: number) => {
    for (const [key, shownAt] of recentlyShownKeysRef.current.entries()) {
      if (now - shownAt > DUPLICATE_REWARD_WINDOW_MS) {
        recentlyShownKeysRef.current.delete(key);
      }
    }
  }, []);

  const openReward = useCallback((reward: QueuedReward) => {
    clearTimers();

    activeRewardRef.current = reward;
    setActiveReward(reward);
    setVisible(true);

    const fromPercent = getProgressPercent(reward.from);
    const toPercent = getProgressPercent(reward.to);
    setDisplayLevel(reward.from.level);
    setBarPercent(fromPercent);

    animationFrameRef.current = window.requestAnimationFrame(() => {
      if (reward.to.level > reward.from.level) {
        setBarPercent(100);
        phaseTwoTimeoutRef.current = window.setTimeout(() => {
          setDisplayLevel(reward.to.level);
          setBarPercent(0);

          animationFrameRef.current = window.requestAnimationFrame(() => {
            setBarPercent(toPercent);
          });
        }, 950);
      } else {
        setBarPercent(toPercent);
      }
    });

    autoCloseTimeoutRef.current = window.setTimeout(() => {
      dismissActiveRewardRef.current();
    }, AUTO_CLOSE_MS);
  }, [clearTimers]);

  const openNextReward = useCallback(() => {
    const nextReward = queueRef.current.shift() ?? null;
    if (!nextReward) {
      activeRewardRef.current = null;
      setActiveReward(null);
      return;
    }

    openReward(nextReward);
  }, [openReward]);

  const dismissActiveReward = useCallback(() => {
    clearTimers();
    setVisible(false);
    advanceTimeoutRef.current = window.setTimeout(() => {
      const currentKey = activeRewardRef.current?.dedupeKey;
      if (currentKey) {
        activeOrQueuedKeysRef.current.delete(currentKey);
        recentlyShownKeysRef.current.set(currentKey, Date.now());
      }
      activeRewardRef.current = null;
      setActiveReward(null);
      openNextRewardRef.current();
    }, 220);
  }, [clearTimers]);

  useEffect(() => {
    dismissActiveRewardRef.current = dismissActiveReward;
    openNextRewardRef.current = openNextReward;
  }, [dismissActiveReward, openNextReward]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const contextValue = useMemo<RewardCelebrationContextValue>(() => ({
    queueReward: (reward) => {
      if (reward.xp <= 0) {
        return;
      }

      const now = Date.now();
      pruneRecentRewardKeys(now);
      const dedupeKey = buildRewardDedupeKey(reward);
      if (
        activeOrQueuedKeysRef.current.has(dedupeKey) ||
        recentlyShownKeysRef.current.has(dedupeKey)
      ) {
        return;
      }

      const queuedReward = {
        ...reward,
        id: `${reward.kind}-${Date.now()}-${queueRef.current.length}`,
        dedupeKey,
      };
      activeOrQueuedKeysRef.current.add(dedupeKey);

      if (!activeRewardRef.current) {
        openReward(queuedReward);
        return;
      }

      queueRef.current.push(queuedReward);
    },
    queueRewards: (rewards) => {
      const validRewards = rewards.filter((reward) => reward.xp > 0);
      if (validRewards.length === 0) {
        return;
      }

      const now = Date.now();
      pruneRecentRewardKeys(now);

      const queuedRewards = validRewards
        .map((reward, index) => ({
          ...reward,
          id: `${reward.kind}-${Date.now()}-${queueRef.current.length + index}`,
          dedupeKey: buildRewardDedupeKey(reward),
        }))
        .filter((reward) => {
          if (
            activeOrQueuedKeysRef.current.has(reward.dedupeKey) ||
            recentlyShownKeysRef.current.has(reward.dedupeKey)
          ) {
            return false;
          }

          activeOrQueuedKeysRef.current.add(reward.dedupeKey);
          return true;
        });

      if (queuedRewards.length === 0) {
        return;
      }

      if (!activeRewardRef.current) {
        const [firstReward, ...remainingRewards] = queuedRewards;
        queueRef.current.push(...remainingRewards);
        openReward(firstReward);
        return;
      }

      queueRef.current.push(...queuedRewards);
    },
  }), [openReward, pruneRecentRewardKeys]);

  const isArabic = language === "ar";

  return (
    <RewardCelebrationContext.Provider value={contextValue}>
      {children}

      {activeReward ? (
        <div
          className={`reward-overlay ${visible ? "reward-overlay-visible" : ""}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="reward-overlay-backdrop" />
          <div className="reward-card-shell">
            <div
              className={`reward-card ${isArabic ? "text-right" : "text-left"}`}
            >
              <div className="reward-card-glow reward-card-glow-a" />
              <div className="reward-card-glow reward-card-glow-b" />

              <div
                className={`reward-card-header ${isArabic ? "flex-row-reverse" : ""}`}
              >
                <div className="reward-card-icon">
                  <RewardIcon kind={activeReward.kind} />
                </div>
                <button
                  type="button"
                  onClick={dismissActiveReward}
                  className="reward-card-dismiss"
                >
                  {isArabic ? "تخطي" : "Skip"}
                </button>
              </div>

              <div className="reward-card-copy">
                <div className="reward-card-badge">
                  {isArabic ? "مكافأة جديدة" : "New reward"}
                </div>
                <h3 className="reward-card-title">
                  {isArabic ? activeReward.titleAr : activeReward.titleEn}
                </h3>
                <p className="reward-card-subtitle">
                  {isArabic
                    ? activeReward.subtitleAr ??
                      "تم احتساب هذا التقدم مباشرة في حسابك."
                    : activeReward.subtitleEn ??
                      "This progress was added directly to your account."}
                </p>
              </div>

              <div className="reward-card-xp">+{activeReward.xp} XP</div>

              <div className="reward-level-card">
                <div
                  className={`reward-level-header ${isArabic ? "flex-row-reverse" : ""}`}
                >
                  <div>
                    <div className="reward-level-label">
                      {isArabic ? "المستوى الحالي" : "Current level"}
                    </div>
                    <div className="reward-level-value">
                      {isArabic ? `المستوى ${displayLevel}` : `Level ${displayLevel}`}
                    </div>
                  </div>
                  <div className={isArabic ? "text-left" : "text-right"}>
                    <div className="reward-level-label">
                      {isArabic ? "بعد المكافأة" : "After reward"}
                    </div>
                    <div className="reward-level-target">
                      {isArabic
                        ? `المستوى ${activeReward.to.level}`
                        : `Level ${activeReward.to.level}`}
                    </div>
                  </div>
                </div>

                <div className="reward-progress-track">
                  <div
                    className="reward-progress-fill"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>

                <div
                  className={`reward-progress-footer ${isArabic ? "flex-row-reverse" : ""}`}
                >
                  <span>
                    {activeReward.from.currentXP.toLocaleString()} /{" "}
                    {activeReward.from.nextLevelXP.toLocaleString()}
                  </span>
                  <span className="reward-progress-arrow">→</span>
                  <span>
                    {activeReward.to.currentXP.toLocaleString()} /{" "}
                    {activeReward.to.nextLevelXP.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </RewardCelebrationContext.Provider>
  );
}
