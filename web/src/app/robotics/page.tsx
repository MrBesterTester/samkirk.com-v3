import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

const DESCRIPTION =
  "Robotics work by Sam Kirk — CritterRitter, a pair of yard-guardian robots where one derives its behaviour from known kinematics and the other learns it by imitation. Built on Drake and LCM instead of ROS, with a Raspberry Pi 3 B+ streaming to an M1 iMac instead of an on-board Jetson.";

export const metadata: Metadata = {
  title: "Robotics — Sam Kirk",
  description: DESCRIPTION,
  openGraph: {
    title: "Robotics — Sam Kirk",
    description: DESCRIPTION,
    url: `${SITE_URL}/robotics`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/robotics`,
  },
};

export default function RoboticsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">Robotics</h1>
      <p className="mt-4 text-lg text-text-secondary">
        <strong className="text-text-primary">CritterRitter</strong> — two yard-guardian robots that
        do the same job two different ways. One derives its behaviour from known kinematics. The
        other learns it by imitation. Same task, same hardware class; the difference is where the
        competence comes from.
      </p>

      {/* The ablation leads: it is a controlled experiment, not a demo. */}
      <div className="mt-10 rounded-lg border border-accent/30 bg-accent/5 p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          The result worth looking at: same controller, LIDAR blanked
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Blank the LIDAR (light detection and ranging) scan and change nothing else. The controller
          is identical in both columns.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 pr-4 font-medium">Run</th>
                <th className="py-2 pr-4 font-medium">Scan live</th>
                <th className="py-2 font-medium">Scan blanked</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border">
                <td className="py-2 pr-4">Robot A, simulation</td>
                <td className="py-2 pr-4 font-semibold text-text-primary">0 collisions / 300 s</td>
                <td className="py-2">113 collisions / 60 s</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Robot B, Drake bridge</td>
                <td className="py-2 pr-4 font-semibold text-text-primary">0 collisions / 3 laps</td>
                <td className="py-2">69 collisions / 30 s</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-text-secondary">
          That is a controlled ablation, independently reproduced across two codepaths — not a demo
          reel. The detector reports a TPR (true-positive rate) of 91.7% and an FPR (false-positive
          rate) of 16.7%, and both misses are explained in the repository — one deliberately
          occluded approach and deliberate distractors — rather than dropped.
        </p>
      </div>

      <h2 className="mt-16 text-2xl font-bold tracking-tight text-text-primary">
        The pair: a teacher and a student
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-primary p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-text-primary">Robot A — the teacher</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Model-based. Pure-pursuit control computed from the <em>known</em> differential-drive
            kinematics. <strong className="text-text-primary">No neural network at all</strong> — its
            acceptance check is literally &ldquo;controller honesty&rdquo;: the controller must be
            derived from the model, not learned.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-primary p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-text-primary">Robot B — the student</h3>
          <p className="mt-2 text-sm text-text-secondary">
            <strong className="text-text-primary">A neural network</strong> — a 16-hidden-unit tanh
            MLP (multi-layer perceptron) with hand-written backpropagation and SGD (stochastic
            gradient descent), in pure NumPy, no framework. It learns the same behaviour by
            imitating Robot A&apos;s trajectories.
          </p>
        </div>
      </div>
      <p className="mt-6 text-text-secondary">
        The pair is the experiment; neither half is interesting alone. One robot is told how the
        world works. The other has to infer it from watching. They are then measured on the same
        task, with the same sensors, in the same simulator.
      </p>

      <h2 className="mt-16 text-2xl font-bold tracking-tight text-text-primary">
        Two deliberate departures
      </h2>

      <h3 className="mt-6 text-lg font-semibold text-accent">
        Drake and LCM instead of ROS
      </h3>
      <p className="mt-2 text-text-secondary">
        Transport is LCM (Lightweight Communications and Marshalling) over UDP (User Datagram
        Protocol) multicast, with a four-message contract. The Mac never installs ROS (Robot
        Operating System) at all. This was not ideology — the position reversed twice, and the
        hardware settled it: the Pi 3 B+ on Raspberry Pi OS has no ROS 2 apt binaries, so the on-bot
        node is plain Python. The perception and control stack is a Drake diagram: state estimator →
        controller → reactive LIDAR layer → command.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-accent">
        A Raspberry Pi 3 B+ and WiFi instead of a Jetson
      </h3>
      <p className="mt-2 text-text-secondary">
        The donor kit shipped without a Jetson. The Pi 3 B+&apos;s 1 GB of RAM (random-access
        memory) is too small for Drake, so Drake stays on the M1 iMac and the robot stays thin: the
        Pi reads the LIDAR, encoders and IMU (inertial measurement unit) and streams them over WiFi;
        the Mac does the thinking and sends velocity commands back. The kit&apos;s motor board still
        presents the Jetson Nano mounting pattern, which is exactly why an interposer plate exists at
        all.
      </p>

      <h2 className="mt-16 text-2xl font-bold tracking-tight text-text-primary">
        Where it actually stands
      </h2>
      <p className="mt-4 text-text-secondary">
        The software is real and exercised; the full robot is not yet bolted together. The bench loop
        has already closed on physical hardware — odometry integrated 0 → 3.12 m at 0.1–0.41 m/s,
        with real 36-beam LIDAR scans driving real wheels, and the RPLIDAR A1M8 confirmed genuine.
        Dead electrical checks passed. Still pending: interposer plates (ordered), standoff
        hardware, powered checkout, and a matched battery set.
      </p>
      <p className="mt-4 text-text-secondary">
        Everything in the repository runs <strong>without any robot hardware</strong> — the
        simulation and the Drake bridge are the point. There are 85 test functions across 9 files
        covering the controllers, the wiring netlist, the serial protocol, and the transport; the
        conversion functions are pure and testable with no ROS and no hardware present.
      </p>

      <div className="mt-10">
        <a
          href="https://github.com/MrBesterTester/critterritter"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:text-accent-hover"
        >
          View CritterRitter on GitHub &rarr;
        </a>
        <p className="mt-1 text-sm text-text-muted">
          Both robots, the Drake bridge, the simulator, the wiring checks, and the parametric CAD
          (computer-aided design).
        </p>
      </div>
    </div>
  );
}
