import { UpdateProfileForm } from "../features/profile/components/UpdateProfileForm";
import { useUpdateProfile } from "../features/profile/hooks/useUpdateProfile";
import { useUpdateProfileTheme } from "../features/profile/hooks/useUpdateProfileTheme";

export default function UpdateProfilePage() {
  const profile = useUpdateProfile();
  const theme = useUpdateProfileTheme();

  return (
    <UpdateProfileForm
      user={profile.user}
      inputs={profile.inputs}
      setInputs={profile.setInputs}
      updating={profile.updating}
      profilePicUrl={profile.profilePicUrl as string | null}
      coverPicUrl={profile.coverPicUrl as string | null}
      fileRef={profile.fileRef}
      coverFileRef={profile.coverFileRef}
      onProfilePicChange={profile.handleProfilePicChange}
      onCoverChange={profile.handleCoverPicChange}
      onSubmit={profile.handleSubmit}
      onCancel={() => profile.navigate(`/${profile.user?.username}`)}
      onBack={() => profile.navigate(`/${profile.user?.username}`)}
      {...theme}
    />
  );
}
