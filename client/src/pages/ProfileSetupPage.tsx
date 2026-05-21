import { ProfileSetupForm } from "../features/profile/components/ProfileSetupForm";
import { useProfileSetup } from "../features/profile/hooks/useProfileSetup";

const ProfileSetupPage = () => {
  const setup = useProfileSetup();

  return (
    <ProfileSetupForm
      user={setup.user}
      inputs={setup.inputs}
      setInputs={setup.setInputs}
      errors={setup.errors}
      loading={setup.loading}
      profilePicUrl={setup.profilePicUrl as string | null}
      coverPicUrl={setup.coverPicUrl as string | null}
      fileRef={setup.fileRef}
      coverFileRef={setup.coverFileRef}
      onProfilePicChange={setup.handleProfilePicChange}
      onCoverChange={setup.handleCoverPicChange}
      onSubmit={setup.handleSubmit}
    />
  );
};

export default ProfileSetupPage;
