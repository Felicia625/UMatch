export type VerificationResult = {
    isOriginal: boolean;
    label: string;
    confidence: number;
};

export const mediaService = {
    verifyProfileImage: async (_uri: string): Promise<VerificationResult> => ({ isOriginal: true, label: 'Ori', confidence: 1 }),
    uploadProfileImage: async (uri: string): Promise<string> => uri,
};
