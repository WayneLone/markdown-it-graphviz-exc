# markdown-it-graphviz-exec

Render GraphViz dot language to svg using the `dot` command.

Depends on [GraphViz](https://graphviz.org/)

```
@graphviz_open
digraph {
    a -> b[label="0.2",weight="0.2"];
    a -> c[label="0.4",weight="0.4"];
    c -> b[label="0.6",weight="0.6"];
    c -> e[label="0.6",weight="0.6"];
    e -> e[label="0.1",weight="0.1"];
    e -> b[label="0.7",weight="0.7"];
}
@graphviz_close
```

## Install

```
yarn add markdown-it-graphviz-exec
```

on macOS:

```
brew install graphviz
```

on Fedora:

```
dnf install graphviz
```

on Debian:

```
apt install graphviz
```
