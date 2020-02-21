# ARMS/3

Assisted Reconnaissance Mission System Mk. III

## Report data

### Barricade/door status

Barricade/door statuses are displayed using standard abbreviations, and are
color coded according to their severity. This data is in a black box with a
solid white border.

- **Opn** - (Red) The doors to the street are open
- **Cls** - (Red) The doors to the street are closed
- **LoB** - (Orange) Loosely barricaded
- **LiB** - (Orange) Lightly barricaded
- **SB** - (Orange) Strongly barricaded
- **QSB** - (Yellow) Quite strongly barricaded
- **VSB** - (Yellow) Very strongly barricaded
- **HB** - (Green) Heavily barricaded
- **VHB** - (Green) Very heavily barricaded
- **EHB** - (Green) Extremely heavily barricaded

### Ruin status

If a ruin is observed from the outside (i.e., the repair cost cannot be
determined), it will show a question mark (?). Otherwise, the repair cost
will be listed. This data is in a red box with white text.

### Generator status

If a building has a generator inside of it, its fuel level will be displayed,
color coded according to its severity. This data is in a black box with a
dotted white border.

- **E** - (Red) Empty
- **VL** - (Orange) Very low
- **L** - (Yellow) Low
- **F** - (Green) Full

### Zombie status

If zombies are spotted on a tile, their number is recorded along with whether
they were spotted inside or outside. When on display, the interior zed count
will be prefixed with `I:` and the exterior zed count will be prefixed with
`O:`. If there were 2 zeds insisde and 1 outside, you would see `I:2 O:1`.
This data is in a green box with black text. Interior zed count will not be
visible for the current tile if the player is indoors, and exterior zed count
will not be visible if the player is outdoors (since the game UI should already
make these numbers obvious).
