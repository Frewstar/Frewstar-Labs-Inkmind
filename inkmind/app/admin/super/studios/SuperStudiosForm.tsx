"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createStudioWithAdmin, getProfilesForStudioAdmin } from "../../actions";

type ProfileOption = { id: string; email: string | null };

export default function SuperStudiosForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadProfiles = useCallback(async (query: string) => {
    const list = await getProfilesForStudioAdmin(query || undefined);
    setProfiles(list);
  }, []);

  useEffect(() => {
    loadProfiles("");
  }, [loadProfiles]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadProfiles(profileSearch);
      debounceRef.current = null;
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [profileSearch, loadProfiles]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function slugFromName(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setName(v);
    if (!slug || slug === slugFromName(name)) setSlug(slugFromName(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!selectedProfile) {
      setError("Please select a profile to assign as Studio Admin.");
      return;
    }
    setLoading(true);
    const result = await createStudioWithAdmin(name.trim(), slug.trim(), selectedProfile.id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setName("");
    setSlug("");
    setSelectedProfile(null);
    setProfileSearch("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-[var(--white)]">Create Studio</h2>

      <div>
        <label htmlFor="studio-name" className="block text-xs font-medium text-[var(--grey)] mb-1">
          Name
        </label>
        <input
          id="studio-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Ink Haven"
          className="w-full rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] px-3 py-2 text-sm text-[var(--white)] placeholder:text-[var(--grey-dim)] focus:border-[var(--gold)] focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="studio-slug" className="block text-xs font-medium text-[var(--grey)] mb-1">
          Slug
        </label>
        <input
          id="studio-slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. ink-haven"
          className="w-full rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] px-3 py-2 text-sm text-[var(--white)] font-mono placeholder:text-[var(--grey-dim)] focus:border-[var(--gold)] focus:outline-none"
          required
        />
      </div>

      <div ref={dropdownRef} className="relative">
        <label className="block text-xs font-medium text-[var(--grey)] mb-1">
          Assign Admin (search by email)
        </label>
        <input
          type="text"
          value={selectedProfile ? selectedProfile.email ?? "" : profileSearch}
          onChange={(e) => {
            setSelectedProfile(null);
            setProfileSearch(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          placeholder="Search or select profile..."
          className="w-full rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] px-3 py-2 text-sm text-[var(--white)] placeholder:text-[var(--grey-dim)] focus:border-[var(--gold)] focus:outline-none"
        />
        {dropdownOpen && (
          <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius)] border border-white/10 bg-[var(--bg-card)] py-1 shadow-lg">
            {profiles.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--grey)]">No profiles found.</li>
            ) : (
              profiles.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProfile(p);
                      setProfileSearch("");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[var(--white)]/90 hover:bg-white/10"
                  >
                    {p.email ?? p.id.slice(0, 8)}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
        {selectedProfile && (
          <p className="mt-1 text-xs text-[var(--gold)]">
            Selected: {selectedProfile.email ?? selectedProfile.id.slice(0, 8)}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-[var(--red)]">{error}</p>
      )}
      {success && (
        <p className="text-sm text-[var(--gold)]">Studio created. Refresh to see it in the table.</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-[var(--radius)] border border-[var(--gold)]/50 bg-[var(--gold-dim)] px-4 py-2 text-sm font-medium text-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)] disabled:opacity-50 transition"
      >
        {loading ? "Creating…" : "Create Studio & Assign Admin"}
      </button>
    </form>
  );
}
