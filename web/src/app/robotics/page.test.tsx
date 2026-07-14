import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RoboticsPage from "./page";

describe("Robotics page", () => {
  it("renders the page heading", () => {
    render(<RoboticsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /robotics/i })
    ).toBeInTheDocument();
  });

  it("links to the critterritter repo", () => {
    render(<RoboticsPage />);

    const links = screen
      .getAllByRole("link")
      .filter((a) =>
        a.getAttribute("href")?.includes("github.com/MrBesterTester/critterritter")
      );
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  // The correction that started this whole plan: Robot A is the model-based teacher with NO neural
  // net; Robot B is the learned student that HAS one. Getting these backwards is the known trap.
  it("says Robot A is the teacher with no neural network", () => {
    render(<RoboticsPage />);

    expect(
      screen.getByRole("heading", { name: /robot a — the teacher/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/no neural network at all/i)).toBeInTheDocument();
  });

  it("says Robot B is the student that carries the neural network", () => {
    render(<RoboticsPage />);

    expect(
      screen.getByRole("heading", { name: /robot b — the student/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/16-hidden-unit tanh/i)).toBeInTheDocument();
  });

  it("leads with the LIDAR ablation numbers", () => {
    render(<RoboticsPage />);

    expect(screen.getByText(/113 collisions \/ 60 s/i)).toBeInTheDocument();
    expect(screen.getByText(/0 collisions \/ 300 s/i)).toBeInTheDocument();
  });

  it("states Drake and LCM rather than ROS, and a Pi 3 B+ rather than a Jetson", () => {
    render(<RoboticsPage />);

    expect(
      screen.getByRole("heading", { name: /drake and lcm instead of ros/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /raspberry pi 3 b\+ and wifi instead of a jetson/i })
    ).toBeInTheDocument();
  });

  it("is honest that the robot is not yet fully assembled", () => {
    render(<RoboticsPage />);

    expect(screen.getByText(/not yet bolted together/i)).toBeInTheDocument();
  });

  it("opens external repo links safely in a new tab", () => {
    render(<RoboticsPage />);

    screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("http"))
      .forEach((a) => {
        expect(a).toHaveAttribute("target", "_blank");
        expect(a).toHaveAttribute("rel", "noopener noreferrer");
      });
  });
});
