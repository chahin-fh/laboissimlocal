"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { jwtDecode } from "jwt-decode";
import { useToast,toast } from "@/hooks/use-toast";

interface User {
  id: string
  email: string
  name: string
  password: string
  role: "member" | "admin" | "chef_d_equipe"
  status: "active" | "banned" | "pending"
  lastLogin?: string
  date_joined: string
  verified: boolean
}

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  category: string
  message: string
  status: "new" | "read" | "replied"
  createdAt: string
}

interface AccountRequest {
  id: string
  name: string
  email: string
  password: string
  reason: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

interface InternalMessage {
  id: string
  senderId: string
  receiverId: string
  subject: string
  message: string
  status: "unread" | "read"
  createdAt: string
  senderName: string
  receiverName: string
  replyToId?: string
  conversationId: string
}

interface AuthContextType {
  user: User | null
  users: User[]
  messages: ContactMessage[]
  accountRequests: AccountRequest[]
  internalMessages: InternalMessage[]
  connectedUsers: User[]
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  // Admin functions
  createUser: (userData: Omit<User, "id" | "date_joined">) => void
  banUser: (userId: string) => void
  unbanUser: (userId: string) => void
  deleteUser: (userId: string) => void
  updateUserRole: (userId: string, role: "member" | "admin" | "chef_d_equipe") => void
  addMessage: (message: Omit<ContactMessage, "id" | "createdAt" | "status">) => Promise<void>
  updateMessageStatus: (messageId: string, status: ContactMessage["status"]) => Promise<void>
  addAccountRequest: (request: Omit<AccountRequest, "id" | "createdAt" | "status">) => Promise<void>
  updateAccountRequest: (requestId: string, status: AccountRequest["status"]) => Promise<void>
  // Internal messaging
  sendInternalMessage: (receiverId: string, subject: string, message: string, replyToId?: string) => Promise<void>
  markMessageAsRead: (messageId: string) => Promise<void>
  getConversation: (userId: string) => Promise<InternalMessage[]>
  getConversations: () => Promise<{ user_id: string; user_name: string; last_message: InternalMessage; unread_count: number }[]>
  getUnreadCount: (userId?: string) => Promise<number>
  getNotifications: () => Promise<{
    newMessages: number
    pendingRequests: number
    unreadInternalMessages: number
  }>
  // Data fetching functions
  fetchMessages: () => Promise<void>
  fetchAccountRequests: () => Promise<void>
  fetchInternalMessages: () => Promise<void>
  fetchUsers: () => Promise<void>
  setUserFromJWT: (token: string) => void;
  setUser: (user: User | null) => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([])
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([])
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetchingUsers, setIsFetchingUsers] = useState(false)

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  // Helper function to validate token
  const isTokenValid = () => {
    const token = localStorage.getItem("token")
    if (!token) return false
    
    try {
      // Check if token is expired (JWT tokens have expiration)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp > currentTime
    } catch (error) {
      console.error("Error validating token:", error)
      return false
    }
  }

  // Helper function to handle API errors
  const handleApiError = (error: any) => {
    console.error("API Error:", error)
    if (error.status === 401 || error.message === "No token found") {
      logout()
    }
  }

  useEffect(() => {
    // Always check for JWT token and fetch user profile if present
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      // Try to fetch user profile from backend
      fetch("http://localhost:8000/api/user/", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 401) {
              // Token is invalid, clear it
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              throw new Error("Invalid token");
            }
            throw new Error("Failed to fetch user");
          }
          return res.json();
        })
        .then(userData => {
          const user: User = {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.username,
            password: "",
            role: userData.is_staff || userData.is_superuser ? "admin" : "member",
            status: "active",
            lastLogin: new Date().toISOString(),
            date_joined: userData.date_joined || new Date().toISOString(),
            verified: true,
          };
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          setConnectedUsers([user]);
          
          // Only fetch data after user is properly set
          setTimeout(() => {
            fetchMessages();
            fetchAccountRequests();
            fetchInternalMessages();
            fetchUsers();
          }, 100);
        })
        .catch((error) => {
          console.error("Error during authentication:", error);
          setUser(null);
          setConnectedUsers([]);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      // Fallback: try to load user from localStorage (for demo/local mode)
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setConnectedUsers([userData]);
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:8000/api/token/email/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.access) {
        localStorage.setItem("token", data.access); // Store JWT token

        // Fetch user data from backend
        const userRes = await fetch("http://localhost:8000/api/user/", {
          headers: {
            "Authorization": `Bearer ${data.access}`,
          },
        });
        if (!userRes.ok) return false;
        const userData = await userRes.json();
        // Map backend user fields to frontend User type
        const user: User = {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.username,
          password: "",
          role: userData.is_staff || userData.is_superuser ? "admin" : "member",
          status: "active",
          lastLogin: new Date().toISOString(),
          date_joined: userData.date_joined || new Date().toISOString(),
          verified: true,
        };
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        setConnectedUsers([user]);
        
        // Fetch data after successful login
        fetchMessages();
        fetchAccountRequests();
        fetchInternalMessages();
        fetchUsers();
        
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null)
    setConnectedUsers([])
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  const createUser = (userData: Omit<User, "id" | "date_joined">) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      date_joined: new Date().toISOString(),
      verified: true,
    }
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
  }

  const banUser = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/ban-user/${userId}/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du bannissement')
      }

      const data = await response.json()
      toast({ title: "Succès", description: data.message, variant: "default" })
      
      // Refresh users list
      await fetchUsers()

      // If current user was banned, logout
      if (user?.id === userId) {
        logout()
      }
    } catch (error) {
      console.error('Error banning user:', error)
      toast({ 
        title: "Erreur", 
        description: error instanceof Error ? error.message : 'Erreur lors du bannissement', 
        variant: "destructive" 
      })
    }
  }

  const unbanUser = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/unban-user/${userId}/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du débannissement')
      }

      const data = await response.json()
      toast({ title: "Succès", description: data.message, variant: "default" })
      
      // Refresh users list
      await fetchUsers()
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast({ 
        title: "Erreur", 
        description: error instanceof Error ? error.message : 'Erreur lors du débannissement', 
        variant: "destructive" 
      })
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/delete-user/${userId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      const data = await response.json()
      toast({ title: "Succès", description: data.message, variant: "default" })
      
      // Refresh users list
      await fetchUsers()

      // If current user was deleted, logout
      if (user?.id === userId) {
        logout()
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({ 
        title: "Erreur", 
        description: error instanceof Error ? error.message : 'Erreur lors de la suppression', 
        variant: "destructive" 
      })
    }
  }

const updateUserRole = async (
  userId: string, // Changed to string to match User.id type
  newRole: "member" | "admin" | "chef_d_equipe"
) => {
  const token = localStorage.getItem("token"); // Retrieve token from localStorage

  if (!token) {
    console.error("No authentication token available. Please log in.");
    toast({ title: "Authentification requise", description: "Veuillez vous reconnecter.", variant: "destructive" });
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/api/admin/update-user-role/${userId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    });

    const data = await response.json();

    if (response.ok) {
      // Update local state so UI shows the new role immediately
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      // Also update current user if they changed their own role
      setUser((prev) => (prev && prev.id === userId ? { ...prev, role: newRole } : prev));
      toast({ title: "Succès", description: data.message || "Rôle mis à jour avec succès" });
    } else {
      toast({ title: "Échec", description: data.error || data.detail || "Erreur lors de la mise à jour du rôle", variant: "destructive" });
    }
  } catch (error) {
    console.error("Error updating role:", error);
    toast({ title: "Erreur serveur", description: "Erreur lors de la mise à jour du rôle", variant: "destructive" });
  }
};

  const addMessage = async (messageData: Omit<ContactMessage, "id" | "createdAt" | "status">) => {
    try {
      const response = await fetch("http://localhost:8000/api/messages/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const newMessage = await response.json()
      setMessages(prev => [newMessage, ...prev])
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }

  const updateMessageStatus = async (messageId: string, status: ContactMessage["status"]) => {
    try {
      const response = await fetch(`http://localhost:8000/api/messages/contact/${messageId}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update message status")
      }

      const updatedMessage = await response.json()
      setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m))
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }

  const addAccountRequest = async (requestData: Omit<AccountRequest, "id" | "createdAt" | "status">) => {
    try {
      const response = await fetch("http://localhost:8000/api/messages/account-requests/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit account request")
      }

      const newRequest = await response.json()
      setAccountRequests(prev => [newRequest, ...prev])
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }

  const updateAccountRequest = async (requestId: string, status: AccountRequest["status"]) => {
    try {
      const response = await fetch(`http://localhost:8000/api/messages/account-requests/${requestId}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update account request")
      }

      const result = await response.json()
      
      if (status === "approved") {
        // Remove the approved request from the list since it's now a user
        setAccountRequests(prev => prev.filter(r => r.id !== requestId))
        // Refresh users list to show the new user
        fetchUsers()
      } else if (status === "rejected") {
        // Remove the rejected request from the list since it's deleted
        setAccountRequests(prev => prev.filter(r => r.id !== requestId))
      } else {
        // Update the request status in the list
        const updatedRequest = await response.json()
        setAccountRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r))
      }

    } catch (error) {
      handleApiError(error)
      throw error
    }
  }



  const sendInternalMessage = async (receiverId: string, subject: string, message: string, replyToId?: string) => {
    if (!user) return

    try {
      const response = await fetch("http://localhost:8000/api/messages/internal/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          receiver: receiverId,
      subject,
      message,
          reply_to: replyToId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const newMessage = await response.json()
      setInternalMessages(prev => [newMessage, ...prev])
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/messages/internal/${messageId}/mark_as_read/`, {
        method: "POST",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to mark message as read")
      }

      const updatedMessage = await response.json()
      setInternalMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m))
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }

  const getConversation = async (userId: string) => {
    if (!user) return []
    
    try {
      const response = await fetch(`http://localhost:8000/api/messages/internal/conversation/?user_id=${userId}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch conversation")
      }

      const messages = await response.json()
      return messages
    } catch (error) {
      handleApiError(error)
      return []
    }
  }

  const getConversations = async () => {
    if (!user) return []

    try {
      const response = await fetch("http://localhost:8000/api/messages/internal/conversations/", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch conversations")
      }

      const conversations = await response.json()
      return conversations
    } catch (error) {
      handleApiError(error)
      return []
    }
  }

  const getUnreadCount = async (userId?: string) => {
    if (!user) return 0
    
    try {
      const url = userId 
        ? `http://localhost:8000/api/messages/internal/unread_count/?user_id=${userId}`
        : "http://localhost:8000/api/messages/internal/unread_count/"
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch unread count")
      }

      const data = await response.json()
      return data.unread_count
    } catch (error) {
      handleApiError(error)
      return 0
    }
  }

  // Function to fetch all messages from backend
  const fetchMessages = async () => {
    if (!user || !isTokenValid()) return
    
    try {
      const response = await fetch("http://localhost:8000/api/messages/contact/", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          logout()
          return
        }
        throw new Error("Failed to fetch messages")
      }

      const messages = await response.json()
      setMessages(messages)
    } catch (error) {
      console.error("Error fetching messages:", error)
      handleApiError(error)
    }
  }

  // Function to fetch all account requests from backend
  const fetchAccountRequests = async () => {
    if (!user || !isTokenValid()) return
    
    try {
      console.log('Fetching account requests...')
      const response = await fetch("http://localhost:8000/api/messages/account-requests/", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          logout()
          return
        }
        throw new Error("Failed to fetch account requests")
      }

      const requests = await response.json()
      console.log('Account requests fetched:', requests)
      setAccountRequests(requests)
    } catch (error) {
      console.error('Error fetching account requests:', error)
      handleApiError(error)
    }
  }

  // Function to fetch all internal messages from backend
  const fetchInternalMessages = async () => {
    if (!user || !isTokenValid()) return
    
    try {
      const response = await fetch("http://localhost:8000/api/messages/internal/", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          logout()
          return
        }
        throw new Error("Failed to fetch internal messages")
      }

      const messages = await response.json()
      setInternalMessages(messages)
    } catch (error) {
      console.error("Error fetching internal messages:", error)
      handleApiError(error)
    }
  }

  // Function to fetch all users from backend
  const fetchUsers = async () => {
    if (!user || !isTokenValid() || isFetchingUsers) return
    
    try {
      setIsFetchingUsers(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          logout()
          return
        }
        throw new Error("Failed to fetch users")
      }

      const usersData = await response.json()
      // Map backend user data to frontend User type
      const mappedUsers: User[] = usersData.map((userData: any) => ({
        id: userData.id.toString(),
        email: userData.email,
        name: userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : userData.username,
        password: "",
        role: userData.role || (userData.is_staff || userData.is_superuser ? "admin" : "member"),
        status: userData.is_active ? "active" : "banned",
        lastLogin: new Date().toISOString(),
        date_joined: userData.date_joined || new Date().toISOString(),
        verified: userData.verified || false,
      }))
      setUsers(mappedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      handleApiError(error)
    } finally {
      setIsFetchingUsers(false)
    }
  }

  const getNotifications = async () => {
    const unreadCount = await getUnreadCount();
    return {
      newMessages: messages.filter((m) => m.status === "new").length,
      pendingRequests: accountRequests.filter((r) => r.status === "pending").length,
      unreadInternalMessages: unreadCount,
    }
  }

  const setUserFromJWT = useCallback((token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      // Map JWT fields to your User type as needed
      const user: User = {
        id: decoded.user_id?.toString() || decoded.sub || "",
        email: decoded.email || "",
        name: decoded.name || decoded.email?.split("@")[0] || "",
        password: "",
        role: "member", // You can adjust this if your JWT includes role
        status: "active",
        lastLogin: new Date().toISOString(),
        date_joined: new Date().toISOString(),
        verified: true,
      };
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      setConnectedUsers([user]);
    } catch (e) {
      // Invalid token
      setUser(null);
      setConnectedUsers([]);
      localStorage.removeItem("user");
    }
  }, [setUser, setConnectedUsers]);

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        messages,
        accountRequests,
        internalMessages,
        connectedUsers,
        login,
        logout,
        loading,
        createUser,
        banUser,
        unbanUser,
        deleteUser,
        updateUserRole,
        addMessage,
        updateMessageStatus,
        addAccountRequest,
        updateAccountRequest,
        sendInternalMessage,
        markMessageAsRead,
        getConversation,
        getConversations,
        getUnreadCount,
        getNotifications,
        fetchMessages,
        fetchAccountRequests,
        fetchInternalMessages,
        fetchUsers,
        setUserFromJWT, // Export this function
        setUser, // Export setUser for Google login
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

