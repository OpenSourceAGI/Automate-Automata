# complexity-automata-cli

Cellular automata animation in your terminal. Conway's Game of Life, fractal
replicators and the 262,143 other rules, drawn in truecolor half-blocks at two
grid rows per terminal line.

```bash
npx complexity-automata-cli          # or: npm i -g complexity-automata-cli
automata
```

## What you get

```
automata                            Conway's Game of Life — gliders, a gun, an acorn
automata fractal                    a Sierpinski triangle grown from one cell
automata gun -f 30                  Gosper's glider gun, fast
automata --rule highlife --auto     a tour of random universes that stay alive
automata -p "Glider Gun"            stamp a pattern and watch it run
automata --load my-universe         reopen something you saved
```

`automata demos`, `automata patterns` and `automata rules` list what there is.

## Keys

| key | |
| --- | --- |
| `space` | play / pause |
| `n` | jump to a random rule |
| `a` | automatic mode — new universe whenever this one stops evolving |
| `r` | random soup |
| `c` | clear the grid |
| `p` | stamp a random pattern |
| `d` | next demo |
| `s` | save this universe |
| `+` `-` | faster / slower |
| `q` | quit |

## Options

```
-d, --demo <id>         start from a demo (default: conway)
-r, --rule <rule>       rule to run, e.g. B3/S23, 6152, highlife
-p, --pattern <name>    stamp a pattern in the centre, e.g. "Glider Gun"
-l, --load <src>        load a saved universe: file path, saved name, or -
-s, --save <file>       write the universe to a file when the run ends
    --name <name>       save to the library under this name when the run ends
-f, --fps <n>           generations per second (default 20)
-g, --generations <n>   stop after n generations
-W, --width <n>         grid width in cells (default: terminal width)
-H, --height <n>        grid height in cells (default: terminal height × 2)
    --density <0..1>    fraction of cells alive when seeding randomly
    --seed <n>          RNG seed, so a run can be reproduced exactly
    --no-wrap           bound the edges instead of wrapping into a torus
-a, --auto              automatic mode
    --color <mode>      auto, truecolor, 256 or mono
    --mono, --ascii     no colour / plain ASCII output
-q, --quiet             hide the status bar
    --print             render one frame to stdout and exit
    --intro             show the intro screen first
```

## In a pipe

Without a TTY — or with `--print` — it runs the generations you ask for and
writes a single frame to stdout, which is what makes it usable in scripts, in a
README, or as a CI check.

```console
$ automata gliders --print -g 30 -W 68 -H 26 --ascii
                     ##                # #
                                       ###
                                       ###
                            #         #   #
 ###                        #    #    ## ##
   #                            # #           ##
  #                           ##   #         #  #
                             # # ##          # #    #
                     ###     ###              #    # #
```

## Saving universes

`s` while running, or `--name`, writes to `~/.complexity-automata/universes.json`.
`--save <file>` writes a single universe file instead.

```bash
automata gun --generations 500 --save gun.json
automata --load gun.json
automata saved                # what is on the shelf
automata forget "old thing"   # take it off
```

Universes are stored as their rule plus their live cells in
[Life RLE](https://conwaylife.com/book/#rle_files), so the same file opens in the
web app, in other Life software, and as a shareable link. Set
`COMPLEXITY_AUTOMATA_HOME` to keep the shelf somewhere else.

## Colour

Truecolor by default, falling back to the 256 colour palette or to plain blocks.
`NO_COLOR` is respected, and output that is not a TTY is never coloured.

Built on [`complexity-automata`](https://www.npmjs.com/package/complexity-automata).

MIT
