# Speaking Status Token Swap

This module swaps a token’s image when the player is speaking through their microphone.

- **Idle image** is displayed when the player is not speaking  
- **Chat image** is displayed while the player is speaking

The module monitors microphone input and updates the token image dynamically.

---

# Features

- Detects microphone activity
- Automatically swaps token images while speaking
- Per-user token image folders
- Adjustable microphone sensitivity
- Optional token outline indicators

---

# Installation

Install the module as normal through Foundry VTT.

After enabling the module, configure the settings in:

Game Settings → Configure Settings → Module Settings

---

# Token Image Setup

This module loads token images from a specific folder structure inside your Foundry world.

You must create the folder structure manually and place the token images in the correct locations.

---

# Folder Structure

Inside your Foundry **Data** directory create the following structure:

Data/
└─ worlds/
   └─ <your-world-folder>/
      └─ speaking-status/
         └─ <user-id>/
            └─ tokens/
               ├─ idle.jpg
               └─ chat.jpg

Example:

Data/worlds/my-dnd-world/speaking-status/AbC123XyZ/tokens/idle.jpg  
Data/worlds/my-dnd-world/speaking-status/AbC123XyZ/tokens/chat.jpg

---

# Getting the User ID

Each player must have their own folder named after their **Foundry User ID**.

To find your user ID:

1. Open Foundry
2. Press **F12** to open the browser console
3. Run:

game.user.id

Use the returned value as the folder name.

Example folder:

speaking-status/
   AbC123XyZ/
      tokens/
         idle.jpg
         chat.jpg

---

# Image Requirements

Each player must provide two images:

| File | Purpose |
|------|--------|
| idle.jpg | Token image when the player is not speaking |
| chat.jpg | Token image shown while speaking |

Recommended:

- Square token images
- Same dimensions as the original token
- JPG or PNG format

Example:

tokens/
   idle.jpg
   chat.jpg

---

# Module Settings

The module provides the following settings.

## Speaking Threshold

Controls microphone sensitivity.

Typical values:

-55  Default  
-58  More sensitive  
-60  Very sensitive  

If the module triggers too often, increase the value (toward 0).  
If speech is not detected reliably, decrease the value.

---

## Token Indicator

Displays a visible outline around the token when the player is speaking.

---

## Round Token Indicator

Uses a rounded border for the speaking indicator.

---

# Example Setup

User ID:

Kq91XkD73

Folder layout:

worlds/my-world/speaking-status/Kq91XkD73/tokens/idle.jpg  
worlds/my-world/speaking-status/Kq91XkD73/tokens/chat.jpg

When the player speaks:

idle.jpg → chat.jpg

When they stop speaking:

chat.jpg → idle.jpg

---

# Notes

- Each player must have their own folder.
- Microphone permissions must be allowed in the browser.
- The module works best with a headset microphone to reduce background noise.
