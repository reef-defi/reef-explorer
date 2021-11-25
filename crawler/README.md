# Reef-crawler

Crawles reef node from multiple node providers. 
Provider urls can currently be modified in `utils/connector.ts`.

Crawled data is then saved into db from: `0.0.0.0:54321`.


Currently crawler works linearly and is adjusted to proces "block after block".
V2 is going to be a harvesting speed up to capture multiple blocks at once.

## Installation

`cd crawler`
`yarn`

## Run crawler

`yarn start`

## Performance test

Preformance tests were conducted by applyling different parameters in the crawling system.
Main question was for how much can multithreading node querying speed up system?
Also we are interested in block size batch.

- n nodes: number of providers used for querying node
- n blocks: nuber of blocks processed in that step
- bps: number of blocks per second
- time: execution time

```
n nodes: 1	n blocks: 1	bps: 7.874	time: 127 ms
n nodes: 1	n blocks: 2	bps: 60.606	time: 33 ms
n nodes: 1	n blocks: 4	bps: 76.923	time: 52 ms
n nodes: 1	n blocks: 8	bps: 96.386	time: 83 ms
n nodes: 1	n blocks: 16	bps: 95.808	time: 167 ms
n nodes: 1	n blocks: 32	bps: 95.808	time: 334 ms
n nodes: 1	n blocks: 64	bps: 103.896	time: 616 ms
n nodes: 1	n blocks: 128	bps: 105.177	time: 1217 ms
n nodes: 1	n blocks: 256	bps: 109.589	time: 2336 ms
n nodes: 1	n blocks: 512	bps: 107.880	time: 4746 ms
n nodes: 1	n blocks: 1024	bps: 107.801	time: 9499 ms
n nodes: 1	n blocks: 2048	bps: 108.578	time: 18862 ms
n nodes: 1	n blocks: 4096	bps: 106.545	time: 38444 ms
n nodes: 1	n blocks: 8192	bps: 104.851	time: 78130 ms
n nodes: 1	n blocks: 16384	bps: 104.495	time: 156792 ms
n nodes: 1	n blocks: 32768	bps: 82.871	time: 395411 ms

n nodes: 2	n blocks: 1	bps: 5.587	time: 179 ms
n nodes: 2	n blocks: 2	bps: 52.632	time: 38 ms
n nodes: 2	n blocks: 4	bps: 56.338	time: 71 ms
n nodes: 2	n blocks: 8	bps: 88.889	time: 90 ms
n nodes: 2	n blocks: 16	bps: 92.486	time: 173 ms
n nodes: 2	n blocks: 32	bps: 100.946	time: 317 ms
n nodes: 2	n blocks: 64	bps: 103.896	time: 616 ms
n nodes: 2	n blocks: 128	bps: 108.844	time: 1176 ms
n nodes: 2	n blocks: 256	bps: 110.871	time: 2309 ms
n nodes: 2	n blocks: 512	bps: 110.751	time: 4623 ms
n nodes: 2	n blocks: 1024	bps: 111.510	time: 9183 ms
n nodes: 2	n blocks: 2048	bps: 113.557	time: 18035 ms
n nodes: 2	n blocks: 4096	bps: 111.335	time: 36790 ms
n nodes: 2	n blocks: 8192	bps: 109.907	time: 74536 ms
n nodes: 2	n blocks: 16384	bps: 105.035	time: 155986 ms
n nodes: 2	n blocks: 32768	bps: 76.119	time: 430482 ms

n nodes: 4	n blocks: 1	bps: 4.464	time: 224 ms
n nodes: 4	n blocks: 2	bps: 17.391	time: 115 ms
n nodes: 4	n blocks: 4	bps: 60.606	time: 66 ms
n nodes: 4	n blocks: 8	bps: 97.561	time: 82 ms
n nodes: 4	n blocks: 16	bps: 116.788	time: 137 ms
n nodes: 4	n blocks: 32	bps: 117.647	time: 272 ms
n nodes: 4	n blocks: 64	bps: 120.075	time: 533 ms
n nodes: 4	n blocks: 128	bps: 125.860	time: 1017 ms
n nodes: 4	n blocks: 256	bps: 127.300	time: 2011 ms
n nodes: 4	n blocks: 512	bps: 128.902	time: 3972 ms
n nodes: 4	n blocks: 1024	bps: 129.522	time: 7906 ms
n nodes: 4	n blocks: 2048	bps: 131.687	time: 15552 ms
n nodes: 4	n blocks: 4096	bps: 129.797	time: 31557 ms
n nodes: 4	n blocks: 8192	bps: 130.925	time: 62570 ms
n nodes: 4	n blocks: 16384	bps: 121.979	time: 134318 ms
n nodes: 4	n blocks: 32768	bps: 78.834	time: 415658 ms

n nodes: 8	n blocks: 1	bps: 4.975	time: 201 ms
n nodes: 8	n blocks: 2	bps: 9.524	time: 210 ms
n nodes: 8	n blocks: 4	bps: 20.619	time: 194 ms
n nodes: 8	n blocks: 8	bps: 88.889	time: 90 ms
n nodes: 8	n blocks: 16	bps: 136.752	time: 117 ms
n nodes: 8	n blocks: 32	bps: 147.465	time: 217 ms
n nodes: 8	n blocks: 64	bps: 167.539	time: 382 ms
n nodes: 8	n blocks: 128	bps: 183.908	time: 696 ms
n nodes: 8	n blocks: 256	bps: 189.069	time: 1354 ms
n nodes: 8	n blocks: 512	bps: 190.264	time: 2691 ms
n nodes: 8	n blocks: 1024	bps: 195.532	time: 5237 ms   <- 3
n nodes: 8	n blocks: 2048	bps: 193.390	time: 10590 ms 
n nodes: 8	n blocks: 4096	bps: 197.702	time: 20718 ms  <- 1.
n nodes: 8	n blocks: 8192	bps: 196.244	time: 41744 ms  <- 2.
n nodes: 8	n blocks: 16384	bps: 175.433	time: 93392 ms
n nodes: 8	n blocks: 32768	bps: 88.741	time: 369255 ms
```