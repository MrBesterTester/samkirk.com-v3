import "server-only";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { FitAnalysis, FitScore, FitCategory } from "./fit-report";
import type { ExtractedJobFields } from "./fit-flow";
import type { ResumeContent } from "./resume-generator";
import type { InterviewConversation, ChatMessage } from "./interview-chat";

// ============================================================================
// Shared Color Palette (mirrors DEFAULT_MARKDOWN_CSS)
// ============================================================================

const colors = {
  text: "#333",
  heading: "#222",
  subtle: "#6a737d",
  link: "#0366d6",
  border: "#dfe2e5",
  borderLight: "#eee",
  bgSubtle: "#f6f8fa",
  white: "#fff",
  scoreWell: "#22863a",
  scoreAverage: "#b08800",
  scorePoorly: "#cb2431",
} as const;

// ============================================================================
// Shared Styles
// ============================================================================

const baseStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 45,
    lineHeight: 1.5,
  },
  h1: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: colors.heading,
    marginBottom: 6,
  },
  h2: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: colors.heading,
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  h3: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.heading,
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  italic: {
    fontFamily: "Helvetica-Oblique",
  },
  link: {
    color: colors.link,
    textDecoration: "none",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginVertical: 12,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 12,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },
  subtle: {
    color: colors.subtle,
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 45,
    right: 45,
    textAlign: "center",
    fontSize: 8,
    color: colors.subtle,
  },
});

// ============================================================================
// Utility: Score color
// ============================================================================

function scoreColor(score: FitScore): string {
  switch (score) {
    case "Well":
      return colors.scoreWell;
    case "Average":
      return colors.scoreAverage;
    case "Poorly":
      return colors.scorePoorly;
  }
}

function scoreLabel(score: FitScore): string {
  switch (score) {
    case "Well":
      return "Strong Fit";
    case "Average":
      return "Average Fit";
    case "Poorly":
      return "Weak Fit";
  }
}

// ============================================================================
// Fit Report PDF Template
// ============================================================================

interface FitReportPdfProps {
  analysis: FitAnalysis;
  extracted: ExtractedJobFields;
}

function FitReportPdf({ analysis, extracted }: FitReportPdfProps) {
  const { overallScore, categories, unknowns, recommendation } = analysis;

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Title */}
        <Text style={baseStyles.h1}>Fit Analysis Report</Text>

        {/* Job info */}
        {(extracted.title || extracted.company) && (
          <Text style={baseStyles.body}>
            <Text style={baseStyles.bold}>
              {extracted.title || "Position"}
              {extracted.company ? ` at ${extracted.company}` : ""}
            </Text>
          </Text>
        )}

        {/* Overall Score */}
        <View
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 10,
            backgroundColor: colors.bgSubtle,
            borderRadius: 4,
            borderLeftWidth: 4,
            borderLeftColor: scoreColor(overallScore),
          }}
        >
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold" }}>
            Overall Fit:{" "}
            <Text style={{ color: scoreColor(overallScore) }}>
              {scoreLabel(overallScore)}
            </Text>
          </Text>
        </View>

        {/* Recommendation */}
        <Text style={baseStyles.h2}>Recommendation</Text>
        <Text style={baseStyles.body}>{recommendation}</Text>

        {/* Category Breakdown */}
        <Text style={baseStyles.h2}>Category Breakdown</Text>
        {categories.map((cat: FitCategory, i: number) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={baseStyles.h3}>
              {cat.name}:{" "}
              <Text style={{ color: scoreColor(cat.score) }}>
                {scoreLabel(cat.score)}
              </Text>
            </Text>
            <Text style={baseStyles.body}>{cat.rationale}</Text>
          </View>
        ))}

        {/* Unknowns */}
        {unknowns.length > 0 && (
          <View>
            <Text style={baseStyles.h2}>Unknowns &amp; Assumptions</Text>
            {unknowns.map((u: string, i: number) => (
              <View key={i} style={baseStyles.bullet}>
                <Text style={baseStyles.bulletDot}>{"\u2022"}</Text>
                <Text style={baseStyles.bulletText}>{u}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Extracted Job Details */}
        <Text style={baseStyles.h2}>Extracted Job Details</Text>
        <ExtractedFieldsList extracted={extracted} />

        {/* Footer */}
        <Text style={baseStyles.footer} fixed>
          Generated by samkirk.com Fit Analysis Tool
        </Text>
      </Page>
    </Document>
  );
}

function ExtractedFieldsList({ extracted }: { extracted: ExtractedJobFields }) {
  const fields: Array<{ label: string; value: string }> = [];
  if (extracted.title) fields.push({ label: "Job Title", value: extracted.title });
  if (extracted.company) fields.push({ label: "Company", value: extracted.company });
  if (extracted.seniority !== "unknown")
    fields.push({ label: "Seniority", value: extracted.seniority });
  if (extracted.locationType !== "unknown")
    fields.push({ label: "Location Type", value: extracted.locationType });
  if (extracted.officeLocation)
    fields.push({ label: "Office Location", value: extracted.officeLocation });
  if (extracted.onsiteDaysPerWeek !== null)
    fields.push({ label: "Onsite Days/Week", value: String(extracted.onsiteDaysPerWeek) });
  if (extracted.estimatedCommuteMinutes !== null)
    fields.push({ label: "Estimated Commute", value: `${extracted.estimatedCommuteMinutes} min` });
  if (extracted.mustHaveSkills.length > 0)
    fields.push({ label: "Must-Have Skills", value: extracted.mustHaveSkills.join(", ") });
  if (extracted.niceToHaveSkills.length > 0)
    fields.push({ label: "Nice-To-Have Skills", value: extracted.niceToHaveSkills.join(", ") });
  if (extracted.yearsExperienceRequired !== null)
    fields.push({ label: "Years Required", value: String(extracted.yearsExperienceRequired) });
  if (extracted.compensationRange)
    fields.push({ label: "Compensation", value: extracted.compensationRange });

  return (
    <View>
      {fields.map((f, i) => (
        <View key={i} style={baseStyles.bullet}>
          <Text style={baseStyles.bulletDot}>{"\u2022"}</Text>
          <Text style={baseStyles.bulletText}>
            <Text style={baseStyles.bold}>{f.label}: </Text>
            {f.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Resume PDF Template
// ============================================================================

const resumeStyles = StyleSheet.create({
  headerName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: colors.heading,
    textAlign: "center",
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: colors.subtle,
    textAlign: "center",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 4,
  },
  contactItem: {
    fontSize: 9,
    color: colors.text,
  },
  contactSep: {
    fontSize: 9,
    color: colors.subtle,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.heading,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    width: 130,
  },
  skillItems: {
    flex: 1,
    fontSize: 10,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 1,
  },
  expTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  expDate: {
    fontSize: 10,
    color: colors.subtle,
  },
  expCompany: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    marginBottom: 3,
  },
  expBullet: {
    flexDirection: "row",
    marginBottom: 1,
    paddingLeft: 8,
  },
  expBulletDot: {
    width: 10,
    fontSize: 10,
  },
  expBulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
  },
  eduRow: {
    marginBottom: 3,
  },
  eduMain: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eduDegree: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  eduYear: {
    fontSize: 10,
    color: colors.subtle,
  },
  eduInstitution: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
  },
  eduDetails: {
    fontSize: 9,
    color: colors.subtle,
  },
});

interface ResumePdfProps {
  content: ResumeContent;
}

function ResumePdf({ content }: ResumePdfProps) {
  const { header } = content;

  // Build contact items
  const contactItems: Array<{ text: string; href?: string }> = [];
  if (header.email) contactItems.push({ text: header.email, href: `mailto:${header.email}` });
  if (header.phone) contactItems.push({ text: header.phone });
  if (header.location) contactItems.push({ text: header.location });
  if (header.linkedIn) {
    const url = header.linkedIn.startsWith("http") ? header.linkedIn : `https://${header.linkedIn}`;
    contactItems.push({ text: header.linkedIn.replace(/^https?:\/\//, ""), href: url });
  }
  if (header.website) {
    const url = header.website.startsWith("http") ? header.website : `https://${header.website}`;
    contactItems.push({ text: header.website.replace(/^https?:\/\//, ""), href: url });
  }

  return (
    <Document>
      <Page size="LETTER" style={{ ...baseStyles.page, paddingTop: 35, paddingBottom: 35, paddingHorizontal: 50 }}>
        {/* Header */}
        <Text style={resumeStyles.headerName}>{header.name}</Text>
        <Text style={resumeStyles.headerTitle}>{header.title}</Text>

        {/* Contact row */}
        {contactItems.length > 0 && (
          <View style={resumeStyles.contactRow}>
            {contactItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={resumeStyles.contactSep}>|</Text>}
                {item.href ? (
                  <Link src={item.href} style={{ ...resumeStyles.contactItem, color: colors.link }}>
                    {item.text}
                  </Link>
                ) : (
                  <Text style={resumeStyles.contactItem}>{item.text}</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Summary */}
        <Text style={resumeStyles.sectionTitle}>Professional Summary</Text>
        <Text style={resumeStyles.summary}>{content.summary}</Text>

        {/* Skills */}
        {content.skills.length > 0 && (
          <View>
            <Text style={resumeStyles.sectionTitle}>Skills</Text>
            {content.skills.map((skill, i) => (
              <View key={i} style={resumeStyles.skillRow}>
                <Text style={resumeStyles.skillCategory}>{skill.category}:</Text>
                <Text style={resumeStyles.skillItems}>{skill.items.join(", ")}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {content.experience.length > 0 && (
          <View>
            <Text style={resumeStyles.sectionTitle}>Professional Experience</Text>
            {content.experience.map((exp, i) => (
              <View key={i} wrap={false}>
                <View style={resumeStyles.expHeader}>
                  <Text style={resumeStyles.expTitle}>{exp.title}</Text>
                  <Text style={resumeStyles.expDate}>{exp.dateRange}</Text>
                </View>
                <Text style={resumeStyles.expCompany}>
                  {exp.company}
                  {exp.location ? ` \u2014 ${exp.location}` : ""}
                </Text>
                {exp.bullets.map((bullet, j) => (
                  <View key={j} style={resumeStyles.expBullet}>
                    <Text style={resumeStyles.expBulletDot}>{"\u2022"}</Text>
                    <Text style={resumeStyles.expBulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {content.education.length > 0 && (
          <View>
            <Text style={resumeStyles.sectionTitle}>Education</Text>
            {content.education.map((edu, i) => (
              <View key={i} style={resumeStyles.eduRow}>
                <View style={resumeStyles.eduMain}>
                  <Text style={resumeStyles.eduDegree}>{edu.degree}</Text>
                  <Text style={resumeStyles.eduYear}>{edu.year}</Text>
                </View>
                <Text style={resumeStyles.eduInstitution}>{edu.institution}</Text>
                {edu.details && <Text style={resumeStyles.eduDetails}>{edu.details}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Additional Sections */}
        {content.additionalSections?.map((section, i) => (
          <View key={i}>
            <Text style={resumeStyles.sectionTitle}>{section.title}</Text>
            <Text style={baseStyles.body}>{section.content}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

// ============================================================================
// Transcript PDF Template
// ============================================================================

interface TranscriptPdfProps {
  conversation: InterviewConversation;
}

function TranscriptPdf({ conversation }: TranscriptPdfProps) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <Text style={baseStyles.h1}>Interview Transcript</Text>

        {/* Metadata */}
        <View style={{ marginBottom: 10 }}>
          <Text style={baseStyles.body}>
            <Text style={baseStyles.bold}>Candidate: </Text>Sam Kirk
          </Text>
          <Text style={baseStyles.body}>
            <Text style={baseStyles.bold}>Date: </Text>
            {new Date(conversation.createdAt).toLocaleDateString()}
          </Text>
          <Text style={baseStyles.body}>
            <Text style={baseStyles.bold}>Total Messages: </Text>
            {String(conversation.messages.length)}
          </Text>
        </View>

        <View style={baseStyles.hr} />

        {/* Messages */}
        {conversation.messages.map((msg: ChatMessage, i: number) => {
          const roleLabel = msg.role === "user" ? "Interviewer" : "Sam Kirk";
          const timestamp = new Date(msg.timestamp).toLocaleTimeString();
          return (
            <View key={i} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
                  {roleLabel}
                </Text>
                <Text style={baseStyles.subtle}>{timestamp}</Text>
              </View>
              <Text style={baseStyles.body}>{msg.content}</Text>
              <View style={baseStyles.hr} />
            </View>
          );
        })}

        {/* Footer */}
        <Text style={baseStyles.footer} fixed>
          Generated by samkirk.com Interview Tool
        </Text>
      </Page>
    </Document>
  );
}

// ============================================================================
// Public API: render to Buffer
// ============================================================================

/**
 * Render a fit report as a PDF buffer.
 */
export async function renderFitReportPdf(
  analysis: FitAnalysis,
  extracted: ExtractedJobFields
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <FitReportPdf analysis={analysis} extracted={extracted} />
  );
  return Buffer.from(buffer);
}

/**
 * Render a resume as a PDF buffer.
 */
export async function renderResumePdf(
  content: ResumeContent
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ResumePdf content={content} />
  );
  return Buffer.from(buffer);
}

/**
 * Render a transcript as a PDF buffer.
 */
export async function renderTranscriptPdf(
  conversation: InterviewConversation
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <TranscriptPdf conversation={conversation} />
  );
  return Buffer.from(buffer);
}
