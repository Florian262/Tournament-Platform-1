import { describe, it, expect } from 'vitest';
import { generateSingleElimination } from './bracketGenerator';
import { TournamentParticipant } from '../types';

describe('bracketGenerator', () => {
  const mockParticipants: TournamentParticipant[] = Array.from({ length: 4 }, (_, i) => ({
    id: `p${i + 1}`,
    tournament_id: 't1',
    team_id: null,
    user_id: `u${i + 1}`,
    seed: i + 1,
    status: 'registered',
    registered_at: new Date().toISOString(),
  }));

  it('generates correct number of matches for power of 2 participants', () => {
    const matches = generateSingleElimination(mockParticipants, 't1');
    // 4 participants -> 2 matches in R1, 1 match in R2 = 3 matches total
    expect(matches.length).toBe(3);
    expect(matches.filter(m => m.round === 1).length).toBe(2);
    expect(matches.filter(m => m.round === 2).length).toBe(1);
  });

  it('correctly handles BYEs for non-power of 2 participants', () => {
    const threeParticipants = mockParticipants.slice(0, 3);
    const matches = generateSingleElimination(threeParticipants, 't1');
    
    // 3 participants -> 2 matches in R1 (one is a BYE), 1 match in R2 = 3 matches total
    expect(matches.length).toBe(3);
    
    const byeMatch = matches.find(m => m.round === 1 && m.status === 'completed');
    expect(byeMatch).toBeDefined();
    expect(byeMatch?.winner_id).toBe('p1'); // Seed 1 should get the BYE
  });

  it('seeds matches correctly (highest vs lowest)', () => {
    const matches = generateSingleElimination(mockParticipants, 't1');
    const round1 = matches.filter(m => m.round === 1);
    
    // In a 4-team bracket: 1 vs 4, 2 vs 3
    const match1 = round1.find(m => m.participant1_id === 'p1');
    expect(match1?.participant2_id).toBe('p4');
    
    const match2 = round1.find(m => m.participant1_id === 'p2');
    expect(match2?.participant2_id).toBe('p3');
  });
});
