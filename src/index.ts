import express, { Express, Request, Response } from 'express';
import { Prisma, PrismaClient, Time } from '@prisma/client'

const app: Express = express();
app.use(express.json());
const port = process.env.PORT;
const prisma = new PrismaClient();


const getUser = async (userId: string, puzzleTypeSlug: string) => {
    const user = await prisma.user.findFirst(
        { 
            where: { id: userId },
            include: {
                times: {
                    where: {
                        puzzleTypeSlug
                    },
                    orderBy: {
                        performedAt: "desc"
                    },
                    take: 12
                }
            }
        }
    );
    if (!user) { return null }

    const timeWhere: Prisma.TimeWhereInput = {
        userId,
        puzzleTypeSlug,
        dnf: false
    };

    const [bestSingle, bestAo5, bestAo12] = await Promise.all([
        prisma.time.findFirst({ where: { ...timeWhere, milliseconds: { gt: 0 } }, orderBy: { milliseconds: "asc" }}),
        prisma.time.findFirst({ where: { ...timeWhere, millisecondsAo5: { gt: 0 } }, orderBy: { millisecondsAo5: "asc" }}),
        prisma.time.findFirst({ where: { ...timeWhere, millisecondsAo12: { gt: 0 } }, orderBy: { millisecondsAo12: "asc" }}),
    ]);

    return {
        user,
        best: {
            single: bestSingle,
            ao5: bestAo5,
            ao12: bestAo12
        }
    }
}


app.get('/users/:userId/:puzzleTypeSlug', async (req: Request, res: Response) => {
    const user = await getUser(req.params.userId, req.params.puzzleTypeSlug);
    if (!user) {
        res.status(404);
        res.send("No user found");
    }
    res.send(user);
});

app.get('/users', async (req: Request, res: Response) => {
    const allUsers = await prisma.user.findMany({
        include: {
            times: {
               take: 5,
               orderBy: {
                   performedAt: 'desc',
               },
            }
        }
    });
    res.send(allUsers);
});

app.get('/times/:puzzleTypeSlug/:userId', async (req: Request, res: Response) => {
    const [user, puzzleType] = await Promise.all([
        prisma.user.findFirst({ where: { id: req.params.userId } }),
        prisma.puzzleType.findFirst({ where: { slug: req.params.puzzleTypeSlug }})
    ]);
    if (!user) {
        res.status(404);
        res.send("User not found");
        return;
    }

    if (!puzzleType) {
        res.status(404);
        res.send("Puzzle Type not found");
        return;
    }

    const times = await prisma.time.findMany({
        where: {
            userId: user.id,
            puzzleTypeSlug: puzzleType.slug
        },
        orderBy: {
            performedAt: 'desc',
        }
    });

    res.send(times)
});

app.post('/times/:puzzleTypeSlug/:userId', async (req: Request, res: Response) => {
    const [user, puzzleType] = await Promise.all([
        prisma.user.findFirst({ 
            where: { id: req.params.userId },
            include: {
                times: {
                    where: {
                        puzzleTypeSlug: req.params.puzzleTypeSlug
                    },
                    orderBy: {
                        performedAt: "desc"
                    },
                    take: 11
                }
            }
        }),
        prisma.puzzleType.findFirst({ where: { slug: req.params.puzzleTypeSlug }})
    ]);

    if (!user) {
        res.status(404);
        res.send("User not found");
        return;
    }
    if (!puzzleType) {
        res.status(404);
        res.send("Puzzle Type not found");
        return;
    }

    const newTime = { 
        milliseconds: req.body.milliseconds ?? 0, 
        dnf: req.body.dnf ?? false,
        penalty: req.body.penalty ?? false
    };

    if (newTime.penalty && newTime.dnf) {
        res.status(422)
        res.send("Time can't be DNF and Penalized at the same time");
    }

    // Calculate ao5 & ao12
    const times = [newTime, ...user.times];

    const calculateAvarage = (allTimes: { milliseconds: number, dnf: boolean }[]): number|null => {
        console.log("Calculating avarages: ", allTimes);

        const dnfCount = allTimes.filter(t => t.dnf).length;
        if (dnfCount > 1) {
            return null;
        }

        const times = allTimes.filter(t => !t.dnf).map(t => t.milliseconds);

        // Sort highest to lowest
        times.sort((a, b) => a - b);
        // Remove highest (if no DNF) and lowest value
        if (dnfCount == 0) {
            times.shift();
        }
        times.pop();
        // Calculate avarage
        return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    }

    let ao5 = null;
    if (times.length >= 5) {
        ao5 = calculateAvarage(times.slice(0, 5));
    }
    let ao12 = null;
    if (times.length >= 12) {
        ao12 = calculateAvarage(times.slice(0, 12));
    }

    const time = await prisma.time.create({
        data: {
            userId: user.id,
            puzzleTypeSlug: puzzleType.slug,
            milliseconds: newTime.milliseconds,
            dnf: newTime.dnf,
            penalty: newTime.penalty,
            millisecondsAo12: ao12,
            millisecondsAo5: ao5,
       }
    });

    const response = await getUser(user.id, puzzleType.slug);
    if (response == null) {
        res.send("OK")
        return;
    }

    // TODO: Check if best in group?
    if (response.best.single?.id == time.id) {
        // TODO: NOTIFY about new best single
        console.log(`new BEST SINGLE for ${user.name}! (${time.milliseconds})`)
    }

    if (response.best.ao5?.id == time.id) {
        // TODO: NOTIFY about new best ao5
        console.log(`new BEST AO5 for ${user.name}! (${time.millisecondsAo5})`)
    }

    if (response.best.ao12?.id == time.id) {
        // TODO: NOTIFY about new best ao12
        console.log(`new BEST AO12 for ${user.name}! (${time.millisecondsAo12})`)
    }

    res.send(response);
})

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});