export const now = () => `[${new Date().toISOString()}]`;
export const log = (...args) => console.log(now(), ...args);
export const logError = (...args) => console.error(now(), ...args);

export function randNum(n) {
  return Math.floor(Math.random() * n) + 1;
}

export function format(obj) {
  return JSON.stringify(obj, null, 2);
}

export const messageKeys = [
  'id',
  'app_permissions',
  'guild_id',
  'channel_id',
  'member.nick',
  'member.permissions',
  'member.user.username',
  'member.user.discriminator',
  'data',
];
// {
//   "app_permissions": "number",
//   "application_id": "number",
//   "channel_id": "number",
//   "data": {
//     "id": "number",
//     "name": "string",
//     "type": 1
//   },
//   "entitlement_sku_ids": [],
//   "guild_id": "number",
//   "guild_locale": "en-US",
//   "id": "number",
//   "locale": "en-US",
//   "member": {
//     "avatar": null,
//     "communication_disabled_until": null,
//     "deaf": false,
//     "flags": 0,
//     "is_pending": false,
//     "joined_at": "2020-12-08T22:51:18.742000+00:00",
//     "mute": false,
//     "nick": "string",
//     "pending": false,
//     "permissions": "number",
//     "premium_since": null,
//     "roles": [],
//     "user": {
//       "avatar": "string",
//       "avatar_decoration": null,
//       "discriminator": "number",
//       "id": "string",
//       "public_flags": 0,
//       "username": "string"
//     }
//   },
//   "token": "string",
//   "type": 2,
//   "version": 1
// }
