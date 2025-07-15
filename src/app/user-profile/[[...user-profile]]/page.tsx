import { UserProfile } from "@clerk/nextjs";

const UserProfilePage = () => (
  <div className="flex items-center justify-center py-8">
    <UserProfile path="/user-profile" routing="path" />
  </div>
);

export default UserProfilePage; 