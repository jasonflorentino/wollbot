# New Commands

- Make a file for the command with a default export:

```javascript
// myCmd.js
export default {
  // name should be all lowercase!
  name: 'command_name',
  description: 'Comand description',
  // function that accepts options object:
  // { request, env, message }
  handler: myCommandHandler,
  // Optional for if command accepts input
  options: [],
};
```

- Then export it from `index.js`:

```javascript
// index.js
export { default as CMD_NAME } from './myCmd.js';
```

- Handle it in `server.js`
- Make sure it gets registered with `register.js`
