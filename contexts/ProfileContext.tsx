import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...data }));
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