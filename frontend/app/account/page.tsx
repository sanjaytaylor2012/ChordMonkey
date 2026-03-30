"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

export default function Account() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

  // Load profile data
  // Load profile data
  useEffect(() => {
    if (!user) return;
    
    setEmail(user.email || "");
    
    // Fetch profile name
    async function fetchProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user!.id)
        .single();
      
      if (data?.name) {
        setName(data.name);
      } else {
        // Fallback to user metadata or email
        setName(user!.user_metadata?.name || user!.email?.split("@")[0] || "");
      }
    }
    
    fetchProfile();
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  async function handleSave() {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);
    
    if (error) {
      console.error("Error updating profile:", error);
    }
    
    setSaving(false);
    setIsEditing(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/welcome");
  }

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background relative px-6 py-12">
        <ParticlesBackground />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Account Settings
          </h1>

          {/* Profile Section */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Profile
            </h2>

            <div className="flex items-start gap-6">
              {/* Avatar */}
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                  {name ? name.charAt(0).toUpperCase() : "🐒"}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="text-foreground font-medium">
                        {name || "Not set"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="text-foreground font-medium">{email}</div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                    >
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">
                    Email Notifications
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Receive updates about your saved songs
                  </div>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    emailNotifications ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      emailNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">Auto-save</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically save chord progressions
                  </div>
                </div>
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    autoSave ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      autoSave ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Sign Out & Danger Zone */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Account
            </h2>

            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Sign Out
              </button>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-red-500 mb-2">
                  Danger Zone
                </h3>
                <button className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}