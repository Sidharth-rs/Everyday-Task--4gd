import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button ,TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';

// Validation functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getPasswordStrength = (password) => {
  let strength = 0; 
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength < 2) return { text: "Weak", color: "#ff4444" };
  if (strength < 4) return { text: "Medium", color: "#ffbb33" };
  return { text: "Strong", color: "#00C851" };
};

const GitCommitSummaryScreen = ({ setScreen }) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCommitSummary = async () => {
    if (!repoUrl) {
      Alert.alert("Error", "Please enter a repository URL.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://192.168.29.188:5001/git/commit-summary", { repositoryUrl: repoUrl });
      setSummary(response.data); // Adjust based on backend response
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch commit summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
    <Text style={styles.title}>Git Commit Summary</Text>
    <TextInput
      style={styles.input}
      placeholder="Enter GitHub Repository URL"
      value={repoUrl}
      onChangeText={setRepoUrl}
    />
    <Button title="Fetch Summary" onPress={fetchCommitSummary} disabled={loading} />
    {loading && <Text>Loading...</Text>}
    {summary && <Text style={styles.summary}>{JSON.stringify(summary, null, 2)}</Text>}
    <Button title="Back to Dashboard" onPress={() => setScreen("dashboard")} />
  </View>
);
};


// Main App Component
const App = () => {
  const [screen, setScreen] = useState("Login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("Feed");
  const [emailError, setEmailError] = useState("");
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check token on app start
  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await axios.get('http://192.168.29.188:5001/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 200) {
          setToken(token);
          setScreen('Dashboard');
        }
      }
    } catch (error) {
      await AsyncStorage.removeItem('userToken');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (screen === "Login") {
      if (!email.trim()) {
        Alert.alert("Error", "Please enter an email");
        return;
      }
      if (!isValidEmail(email)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      setEmailError("");

      try {
        const response = await axios.post("http://192.168.29.188:5001/login/email", {
          email,
        });

        if (response.status === 200) {
          setScreen("Password");
        } else {
          Alert.alert("Error", response.data.message);
        }
      } catch (error) {
        Alert.alert("Error", error.response?.data?.message || "Network error");
      }
    } else if (screen === "Password") {
      if (!password.trim()) {
        Alert.alert("Error", "Please enter a password");
        return;
      }

      const passwordStrength = getPasswordStrength(password);
      if (passwordStrength.text === "Weak") {
        Alert.alert(
          "Weak Password",
          "Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters"
        );
        return;
      }

      try {
        const response = await axios.post("http://192.168.29.188:5001/login/password", {
          email,
          password,
        });

        if (response.status === 200) {
          const { token } = response.data;
          await AsyncStorage.setItem('userToken', token);
          setToken(token);
          setScreen("Dashboard");
          
          // Set up token expiration handler
          setTimeout(() => {
            handleLogout();
          }, response.data.expiresIn * 1000);
        } else {
          Alert.alert("Error", response.data.message);
        }
      } catch (error) {
        Alert.alert("Error", error.response?.data?.message || "Network error");
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setToken(null);
      setScreen('Login');
      setUsername('');
      setEmail('');
      setPassword('');
      Alert.alert('Logged Out', 'Your session has ended');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    if (!email.trim() || !isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address first");
      return;
    }
    Alert.alert(
      "Reset Password",
      `Password reset link will be sent to ${email}`,
      [
        {
          text: "OK",
          onPress: () => setIsResetPassword(false),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Login Screen */}
      {screen === "Login" && (
        <View style={styles.centeredView}>
          <Icon name="leaf-outline" size={100} color="#4CAF50" />
          <Text style={styles.title}>Welcome to Finance Saver and Tracker</Text>
          <Text style={styles.subtitle}>Join us in growing your money!</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Email Address"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError("");
            }}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
  
      {/* Password Screen */}
      {screen === "Password" && (
        <View style={styles.centeredView}>
          <Icon name="lock-closed-outline" size={80} color="#4CAF50" />
          <Text style={styles.title}>Secure Login</Text>
          <Text style={styles.subtitle}>Your details are safe with us.</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
          />
          {password && (
            <Text
              style={[
                styles.passwordStrength,
                { color: getPasswordStrength(password).color },
              ]}
            >
              Password Strength: {getPasswordStrength(password).text}
            </Text>
          )}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      )}
  
      {/* Dashboard */}
      {screen === "Dashboard" && (
        <View style={styles.dashboard}>
          <View style={styles.content}>
            {activeTab === "Feed" && (
              <View>
                <Text style={styles.title}>
                  <Icon name="newspaper-outline" size={20} /> Feed
                </Text>
                <FlatList
                  data={[
                    { id: "1", message: "Join our user-friendly app!" },
                    { id: "2", message: "Save money today to secure your future." },
                    { id: "3", message: "Trusted and well-known app!" },
                  ]}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Text style={styles.feedMessage}>{item.message}</Text>
                  )}
                />
              </View>
            )}
            {activeTab === "Messaging" && (
              <View style={styles.messagingContainer}>
                <Text style={styles.title}>
                  <Icon name="chatbubble-ellipses-outline" size={20} /> Messaging
                </Text>
                <Text style={styles.emptyMessage}>
                  <Icon name="mail-outline" size={20} /> Start a conversation to
                  share your green ideas!
                </Text>
              </View>
            )}
            {activeTab === "Profile" && (
              <View style={styles.profileContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.profileText}>
                  <Icon name="person-outline" size={20} /> Name: {username || "User"}
                </Text>
                <Text style={styles.profileText}>
                  <Icon name="mail-outline" size={20} /> Email: {email}
                </Text>
                <Text style={styles.motto}>Let's Save Money Together!</Text>
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>
                    <Icon name="log-out-outline" size={20} /> Logout
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
  
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={activeTab === "Feed" ? styles.activeTab : styles.tab}
              onPress={() => setActiveTab("Feed")}
            >
              <Icon
                name="newspaper-outline"
                size={24}
                color={activeTab === "Feed" ? "#4CAF50" : "#aaa"}
              />
              <Text style={styles.tabText}>Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === "Messaging" ? styles.activeTab : styles.tab}
              onPress={() => setActiveTab("Messaging")}
            >
              <Icon
                name="chatbubble-outline"
                size={24}
                color={activeTab === "Messaging" ? "#4CAF50" : "#aaa"}
              />
              <Text style={styles.tabText}>Messaging</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === "Profile" ? styles.activeTab : styles.tab}
              onPress={() => setActiveTab("Profile")}
            >
              <Icon
                name="person-outline"
                size={24}
                color={activeTab === "Profile" ? "#4CAF50" : "#aaa"}
              />
              <Text style={styles.tabText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === "GitCommitSummary" ? styles.activeTab : styles.tab}
              onPress={() => setScreen("GitCommitSummary")}
            >
              <Icon
                name="git-branch-outline"
                size={24}
                color={activeTab === "GitCommitSummary" ? "#4CAF50" : "#aaa"}
              />
              <Text style={styles.tabText}>Git Commit Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
  
      {/* Git Commit Summary Screen */}
      {screen === "GitCommitSummary" && <GitCommitSummaryScreen setScreen={setScreen} />}
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  passwordStrength: {
    fontSize: 14,
    marginBottom: 10,
  },
  forgotPassword: {
    marginTop: 20,
  },
  forgotPasswordText: {
    color: "#007BFF",
  },
  dashboard: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  feedMessage: {
    fontSize: 16,
    marginBottom: 10,
  },
  messagingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessage: {
    fontSize: 18,
    textAlign: "center",
    color: "#aaa",
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  profileText: {
    fontSize: 18,
    marginBottom: 10,
  },
  motto: {
    fontSize: 18,
    color: "#4CAF50",
    marginTop: 20,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 10,
  },
  tab: {
    alignItems: "center",
    flex: 1,
  },
  activeTab: {
    alignItems: "center",
    flex: 1,
    borderBottomWidth: 3,
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 12,
    color: "#aaa",
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
