# speaking-status-image
A copy of Xaukael's Speaking Status Repo. But swaps images instead of highlighting a token.

Token Speaking Status – Setup

This module swaps a token’s image when the player is speaking.
Idle image is shown when the player is silent
Chat image is shown while the player is speaking

The module reads images from a folder structure inside your world.

**Folder Structure**
Create the following directory structure inside your Foundry Data folder:
Data/
└─ worlds/
   └─ <your-world-folder>/
      └─ speaking/
         └─ <user-id>/
            └─ tokens/
               ├─ idle.jpg
               └─ chat.jpg
**Example**
Data/worlds/my-dnd-world/speaking/AbC123XyZ/tokens/idle.jpg
Data/worlds/my-dnd-world/speaking/AbC123XyZ/tokens/chat.jpg

**Finding Your User ID**

To get a user’s ID:
Open the Foundry browser console (F12)

Run:
game.user.id

Use that ID as the folder name.

Example:
speaking/
   AbC123XyZ/
      tokens/
         idle.jpg
         chat.jpg

Each player should have their own folder.
