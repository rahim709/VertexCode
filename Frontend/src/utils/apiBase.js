export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl;
    }
    return `${API_BASE_URL}${avatarUrl}`;
};
