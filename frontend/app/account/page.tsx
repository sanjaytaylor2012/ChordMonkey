"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";

export default function Account() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function handleSave() {
    setIsSaving(true);
    // Simulate save 
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 1000);
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background relative px-6 py-12">
        <ParticlesBackground />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Account Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your profile and preferences
            </p>
          </div>

          {/* Profile Section */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Profile</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                🐒
              </div>
              <div>
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-lg bg-muted text-foreground">
                    {name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-lg bg-muted text-foreground">
                    {email}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your saved progressions
                  </p>
                </div>
                <button className="w-12 h-6 rounded-full bg-primary relative transition-colors">
                  <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white transition-all" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto-save</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your work
                  </p>
                </div>
                <button className="w-12 h-6 rounded-full bg-muted relative transition-colors">
                  <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all" />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-card border border-red-500/20 rounded-xl p-6 shadow-sm dark:shadow-none">
            <h2 className="text-xl font-semibold text-red-500 mb-4">
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}