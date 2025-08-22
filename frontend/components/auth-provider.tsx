"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { jwtDecode } from "jwt-decode";

interface User {
  id: string
  email: string
  name: string
  password: string
  role: "member" | "admin"
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
  updateUserRole: (userId: string, role: "member" | "admin") => void
  addMessage: (message: Omit<ContactMessage, "id" | "createdAt" | "status">) => Promise<void>
  updateMessageStatus: (messageId: string, status: ContactMessage["status"]) => Promise<void>
  addAccountRequest: (request: Omit<AccountRequest, "id" | "createdAt" | "status">) => Promise<void>
  updateAccountRequest: (requestId: string, status: AccountRequest["status"]) => Promise<void>
  // Internal messaging
  sendInternalMessage: (receiverId: string, subject: string, message: string, replyToId?: string) => Promise<void>
  markMessageAsRead: (messageId: string) => Promise<void>
  getConversation: (userId: string) => Promise<InternalMessage[]>
  getConversations: () => Promise<{ userId: string; userName: string; lastMessage: InternalMessage; unreadCount: number }[]>
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

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  // Helper function to handle API errors
  const handleApiError = (error: any) => {
    console.error("API Error:", error)
    if (error.status === 401) {
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
          if (!res.ok) throw new Error("Invalid token");
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
          
          // Fetch messages data after user is set
          fetchMessages();
          fetchAccountRequests();
          fetchInternalMessages();
          fetchUsers();
        })
        .catch(() => {
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
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setConnectedUsers([userData]);
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

  const banUser = (userId: string) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, status: "banned" as const } : u))
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    if (user?.id === userId) {
      logout()
    }
  }

  const unbanUser = (userId: string) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, status: "active" as const } : u))
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
  }

  const deleteUser = (userId: string) => {
    const updatedUsers = users.filter((u) => u.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    if (user?.id === userId) {
      logout()
    }
  }

  const updateUserRole = (userId: string, role: "member" | "admin") => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, role } : u))
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    if (user?.id === userId) {
      const updatedUser = { ...user, role }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

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

      const updatedRequest = await response.json()
      setAccountRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r))

    if (status === "approved") {
      const request = accountRequests.find((r) => r.id === requestId)
      if (request) {
        createUser({
          email: request.email,
          name: request.name,
          password: request.password,
          role: "member",
          status: "active",
          verified: true,
        })
      }
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
    if (!user) return
    
    try {
      const response = await fetch("http://localhost:8000/api/messages/contact/", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const messages = await response.json()
      setMessages(messages)
    } catch (error) {
      handleApiError(error)
    }
  }

  // Function to fetch all account requests from backend
  const fetchAccountRequests = async () => {
    if (!user) return
    
    try {
      const response = await fetch("http://localhost:8000/api/messages/account-requests/", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch account requests")
      }

      const requests = await response.json()
      setAccountRequests(requests)
    } catch (error) {
      handleApiError(error)
    }
  }

  // Function to fetch all internal messages from backend
  const fetchInternalMessages = async () => {
    if (!user) return
    
    try {
      const response = await fetch("http://localhost:8000/api/messages/internal/", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch internal messages")
      }

      const messages = await response.json()
      setInternalMessages(messages)
    } catch (error) {
      handleApiError(error)
    }
  }

  // Function to fetch all users from backend
  const fetchUsers = async () => {
    if (!user) return
    
    try {
      const response = await fetch("http://localhost:8000/api/users/", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const usersData = await response.json()
      // Map backend user data to frontend User type
      const mappedUsers: User[] = usersData.map((userData: any) => ({
        id: userData.id.toString(),
        email: userData.email,
        name: userData.username,
        password: "",
        role: userData.is_staff || userData.is_superuser ? "admin" : "member",
        status: userData.is_active ? "active" : "banned",
        lastLogin: new Date().toISOString(),
        date_joined: userData.date_joined || new Date().toISOString(),
        verified: true,
      }))
      setUsers(mappedUsers)
    } catch (error) {
      handleApiError(error)
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
