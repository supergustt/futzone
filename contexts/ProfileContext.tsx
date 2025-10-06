import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

interface GoalkeeperProfile {
  height: string;
  weight: string;
  experienceYears: string;
  location: string;
  pricePerGame: string;
  bio: string;
  availableDays: string[];
  availableTimes: string[];
}

export interface ProfileData {
  name: string;
  address: string;
  position: string;
  yearsPlaying: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
  wins: number;
  rating: number;
  ratingCount: number;
  avatarUrl?: string;
  isGoalkeeper?: boolean;
  goalkeeperProfile?: GoalkeeperProfile;
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const initialProfileData: ProfileData = {
  name: 'João Silva',
  address: 'São Paulo, SP',
  position: 'Meio-campo',
  yearsPlaying: 8,
  gamesPlayed: 47,
  goals: 23,
  assists: 18,
  wins: 31,
  rating: 4.8,
  ratingCount: 127,
  isGoalkeeper: false,
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user and load profile
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Load user profile from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile && !error) {
          setProfileData({
            name: profile.name || 'Usuário',
            address: profile.address || '',
            position: profile.position || 'Meio-campo',
            yearsPlaying: profile.years_playing || 0,
            gamesPlayed: profile.games_played || 0,
            goals: profile.goals || 0,
            assists: profile.assists || 0,
            wins: profile.wins || 0,
            rating: profile.rating || 0,
            ratingCount: profile.rating_count || 0,
            avatarUrl: profile.avatar_url,
            isGoalkeeper: false,
          });
        }
      } else {
        // Reset to default if no user
        setProfileData(initialProfileData);
      }
    };

    loadUserProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        loadUserProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfileData(initialProfileData);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (data: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...data }));
    
    // Update in database if user is authenticated
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            position: data.position,
            years_playing: data.yearsPlaying,
            games_played: data.gamesPlayed,
            goals: data.goals,
            assists: data.assists,
            wins: data.wins,
            avatar_url: data.avatarUrl,
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  return (
    <ProfileContext.Provider value={{ profileData, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}