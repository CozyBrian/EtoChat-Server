export type UserType = {
  pid: string;
  sid: string;
  username: string;
  profileID: string;
  mode: "SHARER" | "LISTENER";
};