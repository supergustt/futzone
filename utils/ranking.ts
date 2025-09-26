export interface PlayerStats {
  wins: number;
  games_played: number;
  goals: number;
  assists: number;
}

export interface RankingResult {
  score: number;
  rank: 'S' | 'A' | 'B' | 'C';
}

export function calculatePlayerRanking(stats: PlayerStats): RankingResult {
  const { wins, games_played, goals, assists } = stats;
  
  // Avoid division by zero
  if (games_played === 0) {
    return { score: 0, rank: 'C' };
  }
  
  // Calculate base metrics
  const winRate = (wins / games_played) * 100;
  const goalsPerGame = goals / games_played;
  const assistsPerGame = assists / games_played;
  
  // Normalize metrics
  const GPG_norm = Math.min(goalsPerGame / 2.5, 1) * 100;
  const APG_norm = Math.min(assistsPerGame / 2.0, 1) * 100;
  const VOL_norm = Math.min(games_played / 50, 1) * 100;
  const WR_norm = Math.max(0, Math.min(winRate, 100));
  
  // Calculate final score
  const score = 0.45 * WR_norm + 0.25 * GPG_norm + 0.20 * APG_norm + 0.10 * VOL_norm;
  const roundedScore = Math.round(score * 10) / 10;
  
  // Determine rank
  let rank: 'S' | 'A' | 'B' | 'C';
  if (roundedScore >= 85) {
    rank = 'S';
  } else if (roundedScore >= 70) {
    rank = 'A';
  } else if (roundedScore >= 55) {
    rank = 'B';
  } else {
    rank = 'C';
  }
  
  return { score: roundedScore, rank };
}

export function getRankColor(rank: 'S' | 'A' | 'B' | 'C'): string {
  switch (rank) {
    case 'S':
      return '#F59E0B'; // Gold
    case 'A':
      return '#10B981'; // Green
    case 'B':
      return '#3B82F6'; // Blue
    case 'C':
      return '#6B7280'; // Gray
    default:
      return '#6B7280';
  }
}

export function getRankDescription(rank: 'S' | 'A' | 'B' | 'C'): string {
  switch (rank) {
    case 'S':
      return 'Elite';
    case 'A':
      return 'Avançado';
    case 'B':
      return 'Intermediário';
    case 'C':
      return 'Iniciante';
    default:
      return 'Iniciante';
  }
}