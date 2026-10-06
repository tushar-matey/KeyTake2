import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool } from 'amazon-cognito-identity-js';
import { userPool } from '../lib/cognito';

interface User {
  userId: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const cognitoUser = userPool.getCurrentUser();
      
      if (cognitoUser) {
        cognitoUser.getSession((err: any, session: any) => {
          if (err) {
            setUser(null);
            setAccessToken(null);
            setIsLoading(false);
            return;
          }
          
          if (session.isValid()) {
            const idToken = session.getIdToken().payload;
            const userId = session.getAccessToken().payload.sub;
            const email = idToken.email;
            
            setUser({ userId, email });
            setAccessToken(session.getAccessToken().getJwtToken());
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const signUp = (email: string, password: string, firstName: string, lastName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'given_name', Value: firstName }),
        new CognitoUserAttribute({ Name: 'family_name', Value: lastName })
      ];
      
      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  };

  const confirmEmail = (email: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });
      
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  };

  const signIn = (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password
      });
      
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });
      
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const idToken = result.getIdToken().payload;
          const userId = result.getAccessToken().payload.sub;
          
          setUser({ userId, email: idToken.email });
          setAccessToken(result.getAccessToken().getJwtToken());
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        }
      });
    });
  };

  const signOut = (): Promise<void> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
      setUser(null);
      setAccessToken(null);
      resolve();
    });
  };

  const forgotPassword = (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });
      
      cognitoUser.forgotPassword({
        onSuccess: function (data) {
          resolve();
        },
        onFailure: function (err) {
          reject(err);
        },
      });
    });
  };

  const confirmResetPassword = (email: string, code: string, newPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });
      
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess() {
          resolve();
        },
        onFailure(err) {
          reject(err);
        }
      });
    });
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    accessToken,
    signUp,
    confirmEmail,
    signIn,
    signOut,
    forgotPassword,
    confirmResetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
