import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { setApiAuthToken, fetchPermissionsApi, savePermissionsApi } from '../services/api';
import type {
  TeamMember,
  AuthUser,
  AccessLevel,
  GovernedModule,
  TeamPermissionsMap
} from '../types';
import { DEFAULT_MEMBER_PERMISSIONS } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  authUser: AuthUser | null;
  currentUser: TeamMember | null;
  isLoading: boolean;
  error: string | null;
  unregisteredEmail: string | null;
  isSuperAdmin: boolean;
  showPinModal: boolean;
  activeRole: string;
  availableRoles: string[];
  permissions: TeamPermissionsMap;
  hasAdminAccess: boolean;
  getModuleAccess: (module: GovernedModule, memberEmail?: string) => AccessLevel;
  canEdit: (module: GovernedModule, memberEmail?: string) => boolean;
  canView: (module: GovernedModule, memberEmail?: string) => boolean;
  updatePermissions: (newMap: TeamPermissionsMap) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  verifyAdminPin: (pin: string) => boolean;
  dismissPinModal: () => void;
  setActiveRole: (role: string) => void;
  clearError: () => void;
  bypassForDemo: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_PIN: string = (import.meta.env.VITE_ADMIN_PIN || '1234').trim();

const ALL_ROLES = [
  'Drafter',
  'Technical Reviewer',
  'Style & Language Reviewer',
  'Orthographic Reviewer',
  'Theological Reviewer',
  'Committee',
  'Final Editor'
];

interface AuthProviderProps {
  children: React.ReactNode;
  team: TeamMember[];
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, team }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unregisteredEmail, setUnregisteredEmail] = useState<string | null>(null);

  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('glbc_super_admin') === 'true';
  });
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [activeRoleOverride, setActiveRoleOverride] = useState<string | null>(null);

  const [demoUser, setDemoUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('glbc_demo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [permissionsMap, setPermissionsMap] = useState<TeamPermissionsMap>(() => {
    try {
      const stored = localStorage.getItem('glbc_rbac_permissions');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Fetch initial permissions from backend API
  useEffect(() => {
    let isMounted = true;
    fetchPermissionsApi().then((res) => {
      if (isMounted && res.success && res.permissions) {
        setPermissionsMap(res.permissions);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setUnregisteredEmail(null);
  }, []);

  // Listen to Firebase auth changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        try {
          const token = await user.getIdToken();
          setIdToken(token);
          setApiAuthToken(token);
        } catch (err) {
          console.warn('Could not fetch ID token:', err);
        }
        setFirebaseUser(user);
        setDemoUser(null);
        localStorage.removeItem('glbc_demo_user');
      } else {
        setFirebaseUser(null);
        setIdToken(null);
        setApiAuthToken(null);
        setIsSuperAdmin(false);
        sessionStorage.removeItem('glbc_super_admin');
        setShowPinModal(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check email registration & admin status when user or team list changes
  useEffect(() => {
    if (!firebaseUser) return;

    const email = (firebaseUser.email || '').toLowerCase().trim();
    if (!email) return;

    // Check if user is in designated admin emails
    const isAdminEmail = ADMIN_EMAILS.includes(email);

    // Find match in team config
    const matched = team.find(
      (m) => m.email && m.email.toLowerCase().trim() === email && m.active
    );

    if (!matched && !isAdminEmail) {
      // Access Denied: not registered in Config and not designated admin
      setUnregisteredEmail(email);
      return;
    }

    setUnregisteredEmail(null);

    // If admin email, check if PIN challenge needed
    if (isAdminEmail && !isSuperAdmin) {
      const alreadyVerified = sessionStorage.getItem('glbc_super_admin') === 'true';
      if (!alreadyVerified) {
        setShowPinModal(true);
      }
    }
  }, [firebaseUser, team, isSuperAdmin]);

  // Construct AuthUser
  const authUser = useMemo<AuthUser | null>(() => {
    if (demoUser) return demoUser;

    if (!firebaseUser) return null;

    const email = (firebaseUser.email || '').toLowerCase().trim();
    const matched = team.find(
      (m) => m.email && m.email.toLowerCase().trim() === email && m.active
    ) || null;

    if (!matched && !ADMIN_EMAILS.includes(email)) {
      return null;
    }

    const availableRoles = isSuperAdmin
      ? ALL_ROLES
      : matched?.roles && matched.roles.length > 0
      ? matched.roles
      : matched?.role
      ? [matched.role]
      : ['Drafter'];

    const effectiveRole = activeRoleOverride && availableRoles.includes(activeRoleOverride)
      ? activeRoleOverride
      : availableRoles[0];

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || matched?.name || 'Team Member',
      photoURL: firebaseUser.photoURL || null,
      idToken: idToken || undefined,
      isSuperAdmin,
      matchedMember: matched,
      activeRole: effectiveRole,
      availableRoles
    };
  }, [firebaseUser, team, isSuperAdmin, idToken, activeRoleOverride, demoUser]);

  // Derive TeamMember for compatibility with existing components
  const currentUser = useMemo<TeamMember | null>(() => {
    if (!authUser) return null;

    if (authUser.matchedMember) {
      return {
        ...authUser.matchedMember,
        role: authUser.activeRole,
        roles: authUser.availableRoles,
        avatar: authUser.photoURL || authUser.matchedMember.avatar
      };
    }

    // Fallback for super admin without matching row in Config
    return {
      name: authUser.displayName || 'Super Admin',
      role: authUser.activeRole,
      phone: '',
      email: authUser.email || '',
      active: true,
      avatar: authUser.photoURL || undefined,
      roles: authUser.availableRoles
    };
  }, [authUser]);

  const signInWithGoogle = useCallback(async () => {
    clearError();
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError('Firebase authentication is not configured yet. Please check your .env credentials.');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Firebase signInWithPopup error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  const signOut = useCallback(async () => {
    clearError();
    setIsSuperAdmin(false);
    sessionStorage.removeItem('glbc_super_admin');
    localStorage.removeItem('glbc_demo_user');
    setDemoUser(null);
    setActiveRoleOverride(null);
    setShowPinModal(false);
    setApiAuthToken(null);

    if (auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
  }, [clearError]);

  const verifyAdminPin = useCallback((pin: string): boolean => {
    if (pin.trim() === ADMIN_PIN) {
      setIsSuperAdmin(true);
      sessionStorage.setItem('glbc_super_admin', 'true');
      setShowPinModal(false);
      return true;
    }
    return false;
  }, []);

  const dismissPinModal = useCallback(() => {
    setShowPinModal(false);
  }, []);

  const setActiveRole = useCallback((role: string) => {
    setActiveRoleOverride(role);
  }, []);

  const hasAdminAccess = useMemo<boolean>(() => {
    if (isSuperAdmin) return true;
    const userEmail = (authUser?.email || '').toLowerCase().trim();
    if (!userEmail) return false;
    if (ADMIN_EMAILS.includes(userEmail)) return true;
    const perm = permissionsMap[userEmail];
    return perm?.admin === 'edit';
  }, [isSuperAdmin, authUser?.email, permissionsMap]);

  const getModuleAccess = useCallback(
    (module: GovernedModule, memberEmail?: string): AccessLevel => {
      const targetEmail = (memberEmail || authUser?.email || '').toLowerCase().trim();
      if (!targetEmail) return DEFAULT_MEMBER_PERMISSIONS[module];

      // Super Admin is ALWAYS 'edit' across all modules
      if (isSuperAdmin && targetEmail === (authUser?.email || '').toLowerCase().trim()) {
        return 'edit';
      }
      if (ADMIN_EMAILS.includes(targetEmail)) {
        return 'edit';
      }

      const memberPerm = permissionsMap[targetEmail];
      if (memberPerm && memberPerm[module]) {
        return memberPerm[module];
      }

      return DEFAULT_MEMBER_PERMISSIONS[module];
    },
    [authUser?.email, isSuperAdmin, permissionsMap]
  );

  const canEdit = useCallback(
    (module: GovernedModule, memberEmail?: string): boolean => {
      return getModuleAccess(module, memberEmail) === 'edit';
    },
    [getModuleAccess]
  );

  const canView = useCallback(
    (module: GovernedModule, memberEmail?: string): boolean => {
      const level = getModuleAccess(module, memberEmail);
      return level === 'edit' || level === 'read';
    },
    [getModuleAccess]
  );

  const updatePermissions = useCallback(
    async (newMap: TeamPermissionsMap): Promise<boolean> => {
      try {
        setPermissionsMap(newMap);
        const res = await savePermissionsApi(newMap, authUser?.email || undefined);
        return res.success;
      } catch (err) {
        console.error('Failed to update permissions:', err);
        return false;
      }
    },
    [authUser?.email]
  );

  const bypassForDemo = useCallback(() => {
    const demo: AuthUser = {
      uid: 'demo-admin-uid',
      email: 'coordinator@glbc.org',
      displayName: 'GLBC Coordinator (Demo)',
      photoURL: null,
      isSuperAdmin: true,
      matchedMember: team[0] || null,
      activeRole: 'Theological Reviewer',
      availableRoles: ALL_ROLES
    };
    setDemoUser(demo);
    localStorage.setItem('glbc_demo_user', JSON.stringify(demo));
    setIsSuperAdmin(true);
  }, [team]);

  const value = useMemo(
    () => ({
      firebaseUser,
      authUser,
      currentUser,
      isLoading,
      error,
      unregisteredEmail,
      isSuperAdmin,
      showPinModal,
      activeRole: authUser?.activeRole || 'Drafter',
      availableRoles: authUser?.availableRoles || [],
      permissions: permissionsMap,
      hasAdminAccess,
      getModuleAccess,
      canEdit,
      canView,
      updatePermissions,
      signInWithGoogle,
      signOut,
      verifyAdminPin,
      dismissPinModal,
      setActiveRole,
      clearError,
      bypassForDemo
    }),
    [
      firebaseUser,
      authUser,
      currentUser,
      isLoading,
      error,
      unregisteredEmail,
      isSuperAdmin,
      showPinModal,
      permissionsMap,
      hasAdminAccess,
      getModuleAccess,
      canEdit,
      canView,
      updatePermissions,
      signInWithGoogle,
      signOut,
      verifyAdminPin,
      dismissPinModal,
      setActiveRole,
      clearError,
      bypassForDemo
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
