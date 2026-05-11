// ─── User Profile Types ──────────────────────────────────────────────────────
// Thông tin cá nhân + chỉ số cơ thể

export type Gender = "male" | "female" | "other";

export interface UserProfile {
    id: string;
    user_id: string;
    age: number | null;
    gender: Gender | null;
    height_cm: number | null;
    weight_kg: number | null;
    chest_cm: number | null;
    waist_cm: number | null;
    hip_cm: number | null;
    bicep_cm: number | null;
    thigh_cm: number | null;
    created_at: string;
    updated_at: string;
}

export type UserProfileUpsert = Omit<
    UserProfile,
    "id" | "user_id" | "created_at" | "updated_at"
>;

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_USER_PROFILE: UserProfileUpsert = {
    age: null,
    gender: null,
    height_cm: null,
    weight_kg: null,
    chest_cm: null,
    waist_cm: null,
    hip_cm: null,
    bicep_cm: null,
    thigh_cm: null,
};

// ─── Labels ──────────────────────────────────────────────────────────────────

export const GENDER_LABELS: Record<Gender, string> = {
    male: "Nam",
    female: "Nữ",
    other: "Khác",
};

export const BODY_MEASUREMENT_LABELS: Record<string, string> = {
    chest_cm: "Ngực",
    waist_cm: "Eo",
    hip_cm: "Mông",
    bicep_cm: "Bắp tay",
    thigh_cm: "Đùi",
};

export const BODY_MEASUREMENT_ICONS: Record<string, string> = {
    chest_cm: "📏",
    waist_cm: "📏",
    hip_cm: "📏",
    bicep_cm: "💪",
    thigh_cm: "🦵",
};

export type BodyMeasurementKey = keyof Pick<
    UserProfile,
    "chest_cm" | "waist_cm" | "hip_cm" | "bicep_cm" | "thigh_cm"
>;

export const BODY_MEASUREMENT_KEYS: BodyMeasurementKey[] = [
    "chest_cm",
    "waist_cm",
    "hip_cm",
    "bicep_cm",
    "thigh_cm",
];
