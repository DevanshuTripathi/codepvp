import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Upload, Check } from 'lucide-react';

// Avatar options
const avatarOptions = {
  boy: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  ],
  girl: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  ],
};

// Programming languages
const languages = [
  'JavaScript', 'Python', 'Java', 'C++', 'C', 'Go', 
  'Rust', 'TypeScript', 'Ruby', 'PHP', 'Swift', 'Kotlin'
];

// Skill levels
const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Form data
  const [avatarType, setAvatarType] = useState<'boy' | 'girl'>('boy');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [customAvatar, setCustomAvatar] = useState<File | null>(null);
  const [username, setUsername] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setCustomAvatar(file);
      setSelectedAvatar(URL.createObjectURL(file));
    }
  };

  // Handle language selection
  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  // Validate current step
  const validateStep = () => {
    switch (step) {
      case 1:
        if (!selectedAvatar) {
          toast.error('Please select an avatar');
          return false;
        }
        return true;
      case 2:
        if (!username.trim()) {
          toast.error('Please enter a username');
          return false;
        }
        if (username.length < 3) {
          toast.error('Username must be at least 3 characters');
          return false;
        }
        if (!selectedLanguages.length) {
          toast.error('Please select at least one language');
          return false;
        }
        if (!skillLevel) {
          toast.error('Please select your skill level');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // Handle next button
  const handleNext = () => {
    if (validateStep()) {
      if (step < 2) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  // Submit onboarding data
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username.trim()));
        const querySnapshot = await getDocs(q);

        const isTaken = querySnapshot.docs.some(doc => doc.id !== user.uid);

        if (isTaken) {
          toast.error('This username is already taken. Please choose another.');
          setLoading(false);
          return; // Stop submission
        }

        let avatarUrl = selectedAvatar;

        if (customAvatar) {
          const formData = new FormData();
          formData.append('avatar', customAvatar);

          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload-avatar`, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error('Avatar upload failed');
          }

          const data = await res.json();
          avatarUrl = data.url; // THIS is your real Cloudinary URL
        }
        // Update user profile in Firebase Auth
        await updateProfile(user, {
          displayName: username,
          photoURL: avatarUrl,
        });

        // Map skill level to initial rating
        const getInitialRating = (level: string) => {
          switch (level) {
            case 'Beginner': return 200;
            case 'Intermediate': return 400;
            case 'Advanced': return 600;
            case 'Expert': return 800;
            default: return 200;
          }
        };

        // Save user details to Firestore
        const userData = {
          uid: user.uid,
          email: user.email,
          username,
          languages: selectedLanguages,
          skillLevel,
          bio,
          avatar: avatarUrl,
          completedOnboarding: true,
          rating: getInitialRating(skillLevel), // Set rating based on skill level
          questionsSolved: 0, // Start with 0 questions solved
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Create/update user document in 'users' collection
        await setDoc(doc(db, 'users', user.uid), userData);

        // Also keep in localStorage for quick access
        localStorage.setItem('userProfile', JSON.stringify(userData));

        toast.success('Profile setup complete! Welcome to CodePVP!');
        navigate('/');
      } else {
        toast.error('No user found. Please sign up again.');
        navigate('/signup');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg border border-gray-800 hover:border-gray-700 transition-colors p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-cyan-400 text-sm font-medium">Step {step} of 2</span>
            <span className="text-purple-400 text-sm font-medium">{step === 1 ? 'Avatar' : 'Details'}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Avatar Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">Choose Your Avatar</h2>
              <p className="text-gray-400">Select a default avatar or upload your own</p>
            </div>

            {/* Avatar Type Toggle */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => {
                  setAvatarType('boy');
                  if (!customAvatar) setSelectedAvatar('');
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  avatarType === 'boy' 
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                Boy
              </button>
              <button
                onClick={() => {
                  setAvatarType('girl');
                  if (!customAvatar) setSelectedAvatar('');
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  avatarType === 'girl' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                Girl
              </button>
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {avatarOptions[avatarType].map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    setCustomAvatar(null);
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all hover:scale-105 ${
                    selectedAvatar === avatar 
                      ? 'border-cyan-500 ring-4 ring-cyan-500/50 shadow-lg shadow-cyan-500/50' 
                      : 'border-gray-700 hover:border-cyan-400'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                  {selectedAvatar === avatar && (
                    <div className="absolute top-2 right-2 bg-cyan-500 rounded-full p-1">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Upload */}
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-cyan-500 transition-colors bg-gray-800/30">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <label htmlFor="avatar-upload" className="cursor-pointer">
                {customAvatar ? (
                  <div className="flex items-center justify-center gap-3">
                    <img 
                      src={selectedAvatar} 
                      alt="Custom avatar" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <p className="text-white font-medium">{customAvatar.name}</p>
                      <p className="text-gray-400 text-sm">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-cyan-400" />
                    <p className="text-white font-medium">Upload Custom Avatar</p>
                    <p className="text-gray-500 text-sm">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Step 2: User Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">Complete Your Profile</h2>
              <p className="text-gray-400">Tell us more about yourself</p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-white font-medium mb-2">Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>

            {/* Preferred Languages */}
            <div>
              <label className="block text-white font-medium mb-2">Preferred Languages * (Select multiple)</label>
              <div className="grid grid-cols-3 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedLanguages.includes(lang)
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-white font-medium mb-2">Skill Level *</label>
              <div className="grid grid-cols-4 gap-2">
                {skillLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSkillLevel(level)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      skillLevel === level
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-lg shadow-purple-500/50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-white font-medium mb-2">Bio (Optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={200}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none transition-all"
              />
              <p className="text-gray-500 text-sm mt-1">{bio.length}/200 characters</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 border border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-medium hover:from-cyan-500 hover:to-purple-500 shadow-lg shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : step === 2 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
