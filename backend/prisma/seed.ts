import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Cricket Tournament Management System Database...');

  // 1. Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cricket.com' },
    update: {},
    create: {
      email: 'admin@cricket.com',
      password: hashedPassword,
      name: 'Tournament Director',
      role: 'ADMIN',
    },
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // 2. Tournament Creation
  const tournament1 = await prisma.tournament.upsert({
    where: { slug: 'premier-cricket-league-2026' },
    update: {},
    create: {
      title: 'Premier Cricket League 2026',
      slug: 'premier-cricket-league-2026',
      description: 'The premier T20 tournament featuring top regional cricket franchises competing for the trophy.',
      format: 'LEAGUE_KNOCKOUT',
      overs: 20,
      powerplayOvers: 6,
      ballType: 'Kookaburra Red Leather',
      ground: 'Wankhede Cricket Stadium',
      city: 'Mumbai',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-25'),
      registrationDeadline: new Date('2026-07-25'),
      entryFee: 500,
      prizePool: '$50,000 Cash Prize + Trophy',
      logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      rules: '1. Standard ICC T20 Playing conditions apply.\n2. Maximum 4 overs per bowler.\n3. Super Over in case of a tie.',
      contactEmail: 'organizer@pcl2026.com',
      contactPhone: '+1 (555) 019-2834',
      status: 'PUBLISHED',
    },
  });

  // 3. Teams
  const teamsData = [
    {
      name: 'Mumbai Strikers',
      shortName: 'MST',
      logoUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=200&q=80',
      city: 'Mumbai',
      captainName: 'Rohit Sharma',
      coachName: 'Mahela Jayawardene',
    },
    {
      name: 'Bangalore Express',
      shortName: 'BEX',
      logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=200&q=80',
      city: 'Bangalore',
      captainName: 'Virat Kohli',
      coachName: 'Andy Flower',
    },
    {
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=200&q=80',
      city: 'Chennai',
      captainName: 'MS Dhoni',
      coachName: 'Stephen Fleming',
    },
    {
      name: 'Delhi Dynamos',
      shortName: 'DDY',
      logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=200&q=80',
      city: 'Delhi',
      captainName: 'Rishabh Pant',
      coachName: 'Ricky Ponting',
    },
  ];

  const createdTeams = [];
  for (const td of teamsData) {
    const t = await prisma.team.create({ data: td });
    createdTeams.push(t);

    // Link team to tournament
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: tournament1.id,
        teamId: t.id,
        matchesPlayed: 1,
        wins: td.shortName === 'MST' || td.shortName === 'CSK' ? 1 : 0,
        losses: td.shortName === 'BEX' || td.shortName === 'DDY' ? 1 : 0,
        points: td.shortName === 'MST' || td.shortName === 'CSK' ? 2 : 0,
        netRunRate: td.shortName === 'MST' ? 0.850 : td.shortName === 'CSK' ? 0.620 : -0.730,
      },
    });
  }

  console.log(`🏏 Teams created: ${createdTeams.length}`);

  // 4. Players
  const team1 = createdTeams[0]; // Mumbai Strikers
  const team2 = createdTeams[1]; // Bangalore Express

  const mstPlayers = [
    { name: 'Rohit Sharma', jerseyNumber: 45, role: 'BATSMAN', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Off-Spin' },
    { name: 'Ishan Kishan', jerseyNumber: 32, role: 'WICKET_KEEPER', battingStyle: 'Left-Handed', bowlingStyle: 'None' },
    { name: 'Suryakumar Yadav', jerseyNumber: 63, role: 'BATSMAN', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Medium' },
    { name: 'Hardik Pandya', jerseyNumber: 33, role: 'ALL_ROUNDER', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Fast' },
    { name: 'Jasprit Bumrah', jerseyNumber: 93, role: 'BOWLER', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Fast' },
  ];

  const bexPlayers = [
    { name: 'Virat Kohli', jerseyNumber: 18, role: 'BATSMAN', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Medium' },
    { name: 'Faf du Plessis', jerseyNumber: 13, role: 'BATSMAN', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Leg-Spin' },
    { name: 'Glenn Maxwell', jerseyNumber: 32, role: 'ALL_ROUNDER', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Off-Spin' },
    { name: 'Dinesh Karthik', jerseyNumber: 19, role: 'WICKET_KEEPER', battingStyle: 'Right-Handed', bowlingStyle: 'None' },
    { name: 'Mohammed Siraj', jerseyNumber: 73, role: 'BOWLER', battingStyle: 'Right-Handed', bowlingStyle: 'Right-Arm Fast' },
  ];

  const createdMstPlayers = [];
  for (const p of mstPlayers) {
    const pl = await prisma.player.create({ data: { ...p, teamId: team1.id } });
    createdMstPlayers.push(pl);
  }

  const createdBexPlayers = [];
  for (const p of bexPlayers) {
    const pl = await prisma.player.create({ data: { ...p, teamId: team2.id } });
    createdBexPlayers.push(pl);
  }

  console.log('👥 Players populated successfully.');

  // 5. Matches & Live State
  // Live Match: MST vs BEX
  const liveMatch = await prisma.match.create({
    data: {
      tournamentId: tournament1.id,
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      stage: 'LEAGUE',
      matchNumber: 1,
      status: 'LIVE',
      scheduledAt: new Date(),
      venue: 'Wankhede Stadium, Mumbai',
      umpire1: 'Nitin Menon',
      umpire2: 'Kumar Dharmasena',
      tossWinnerId: team1.id,
      tossDecision: 'BAT',
      targetRuns: 176,
    },
  });

  // Innings 1 (MST Batting - Completed 175/4)
  const inn1 = await prisma.innings.create({
    data: {
      matchId: liveMatch.id,
      inningNumber: 1,
      battingTeamId: team1.id,
      bowlingTeamId: team2.id,
      totalRuns: 175,
      wickets: 4,
      overs: 20.0,
      wideExtras: 4,
      noBallExtras: 1,
      isCompleted: true,
    },
  });

  // Innings 2 (BEX Batting - In progress 142/3 in 15.4 overs)
  const inn2 = await prisma.innings.create({
    data: {
      matchId: liveMatch.id,
      inningNumber: 2,
      battingTeamId: team2.id,
      bowlingTeamId: team1.id,
      totalRuns: 142,
      wickets: 3,
      overs: 15.4,
      wideExtras: 3,
      noBallExtras: 1,
      isCompleted: false,
    },
  });

  // Populate sample ball history for active over in Innings 2
  const striker = createdBexPlayers[0]; // Virat Kohli
  const nonStriker = createdBexPlayers[2]; // Glenn Maxwell
  const bowler = createdMstPlayers[4]; // Jasprit Bumrah

  const ballEvents = [
    { overNumber: 15, ballNumberInOver: 1, runs: 1, commentary: '1 run, length ball pushed to deep cover.' },
    { overNumber: 15, ballNumberInOver: 2, runs: 4, commentary: 'FOUR! Slashed over backward point with exquisite timing!' },
    { overNumber: 15, ballNumberInOver: 3, runs: 0, commentary: 'Dot ball. Good yorker right on the toes.' },
    { overNumber: 15, ballNumberInOver: 4, runs: 6, commentary: 'SIX! Towering shot over long-on! That reached the upper deck!' },
  ];

  for (const b of ballEvents) {
    await prisma.ballEvent.create({
      data: {
        inningsId: inn2.id,
        overNumber: b.overNumber,
        ballNumberInOver: b.ballNumberInOver,
        bowlerId: bowler.id,
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        runs: b.runs,
        commentary: b.commentary,
        wagonWheelZone: b.runs === 6 ? 'LONG_ON' : b.runs === 4 ? 'POINT' : 'COVER',
      },
    });
  }

  // 6. Announcements & Sponsors
  await prisma.announcement.create({
    data: {
      tournamentId: tournament1.id,
      title: 'Grand Final Tickets Now Open',
      content: 'Book your tickets for the Premier Cricket League 2026 Grand Finale at Wankhede Stadium.',
      isImportant: true,
    },
  });

  await prisma.sponsor.create({
    data: {
      tournamentId: tournament1.id,
      name: 'Apex Global Sports',
      tier: 'TITLE',
      logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=200&q=80',
    },
  });

  console.log('✅ Database seeded successfully with live cricket match state!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
