# monetization and distribution hypothesis

## status and scope

- prepared: 2026-10-08.
- horizon: the first 12 months after public launch.
- currency: usd; figures exclude taxes.
- owner: founder; proposals require future product and campaign decisions.
- scope: demand, human use cases, search, social distribution, export ads, and tam/sam/som.
- evidence: current source code, public product documentation, surveys, and selected community discussions.
- limits: no keyword-volume account, live traffic, interviews, advertiser contract, or measured ad yield was available.
- this report proposes experiments. it does not authorize publishing, outreach, spending, or implementation.

## 1. assessment

viewkit has potential as a focused utility for short, practical video tasks.
the strongest hypothesis is occasional desktop editing without uploading footage or learning a large editor.
repeat occupational tasks could create more valuable demand than broad creator entertainment.

ad-on-export is a weak standalone business until substantial qualified usage exists.
one completed ad might earn fractions of a cent. content production still costs money and time.
local rendering reduces server processing costs, but it does not remove marketing, support, hosting, or ad operations costs.

the illustrative base case produces about $163 in year-one ad revenue from 176,000 site visits.
the stretch case produces about $8,791 from 1.5 million visits with much stronger conversion and yield.
these are conditional scenarios, not forecasts. current simulated ads generate no advertising revenue.

recommendation: validate three concrete jobs, then scale demonstrated distribution paths.
keep ad-supported export as an experiment. consider paid ad removal if repeat usage emerges.

## 2. what the current product can honestly promise

the implementation and [product requirements](../PRD.md) describe a desktop editor for short, local projects.
the current [import/export agreement](../contracts/import-export.contract.md) describes local processing and a simulated export gate.

| capability | useful marketing claim | boundary |
|---|---|---|
| trim, split, rearrange, join clips | cut unwanted footage and assemble short sequences | joining requires timeline arrangement |
| video and audio lanes, per-clip volume | combine short clips with audio or mute unwanted sound | no automatic sound cleanup or speech processing |
| stage dimensions, position, scale, rotation | manually reframe and rotate footage | no automatic subject tracking or crop wizard |
| local processing and browser saving | edit without uploading source footage | ads and analytics would still make network requests |
| mp4 output without an app watermark | export a clean mp4 | 24 fps is fixed; every export is re-encoded |
| one browser-saved project | return to the current project | no cloud sync, collaboration, or project library |
| desktop chrome/edge target | edit on a supported desktop browser | mobile is outside current acceptance scope |

do not advertise subtitles, text overlays, photo slideshows, templates, transitions, ai editing, compression targets, or lossless export.
do not advertise demonstrated renderer speed superiority. current native rendering lacks a comparative benchmark.
short-video acquisition from mobile feeds must acknowledge the desktop requirement.

## 3. demand evidence and competition

### public signals

| observation | evidence | interpretation |
|---|---|---|
| some users want a tiny edit without opening a large editor | [browser-cutting discussion](https://www.reddit.com/r/VideoEditing/comments/y94zkj) | supports a quick-task positioning; anecdotal, not population research |
| users complain about export obstacles and unreliable browser editing | [browser-editor discussion](https://www.reddit.com/r/VideoEditing/comments/r832c4) | successful export is a central trust requirement |
| joining clips is a distinct need | [automated joining request](https://www.reddit.com/r/editing/comments/sjhsxi) | a focused join workflow may outperform a generic editor landing page |
| some requests involve hours of footage | [long merge request](https://www.reddit.com/r/VideoEditing/comments/1dzyks0) | demand exists outside viewkit's short-project fit |
| some buyers require 2160p/60 fps or cloud processing | [basic online editor request](https://www.reddit.com/r/CreatorServices/comments/1n01nif) | those requirements should disqualify current acquisition claims |
| vendors maintain separate trim, crop, merge, and mute journeys | [adobe video tools](https://www.adobe.com/express/feature/video/editor), [merge documentation](https://helpx.adobe.com/uk/express/web/video-creation-and-editing/edit-videos/merge-videos.html) | corroborates recognizable job categories; does not establish search volume |

these discussions are a convenience sample. several are old, and some threads contain promotion.
use them to form interview questions, not to estimate conversion or market share.

wyzowl's 2026 survey reports 91% video adoption among surveyed businesses.
its 266 respondents included marketers and consumers, surveyed in late 2025.
this supports contextual interest, not a census of all businesses. [survey and methodology](https://wyzowl.com/video-marketing-statistics/)

### competing alternatives

| alternative | verified public positioning | implication for viewkit |
|---|---|---|
| clipchamp | free core editing and watermark-free exports up to 1080p | free clean exports are already available; [microsoft support](https://support.microsoft.com/en-us/clipchamp/what-are-the-clipchamp-paid-plans-and-how-do-they-work) |
| canva | watermark-free output when using free assets | visual templates are a strong alternative; [canva editor](https://www.canva.com/video-editor/) |
| kapwing | free exports have a watermark; paid plans remove it | watermark frustration is useful positioning, but not universally differentiating; [kapwing policy](https://www.kapwing.com/help/our-watermark-policy/) |
| videos-edit | advertises local editing, no account, and no watermark | privacy and no-signup positioning already have direct competitors; [product page](https://videos-edit.com/) |
| phone editors and desktop software | existing workflows require no new discovery step | interviews must compare viewkit against what people already use |

vendor claims were read, not independently benchmarked.
viewkit needs a specific successful job and clear workflow, beyond repeating free/no-upload slogans.

## 4. human use cases: who needs which result?

the following search phrases are candidate wording. they are not observed keyword counts or verified searcher demographics.
occupation-specific scenarios below are hypotheses unless their evidence is explicitly linked.

| person and immediate situation | finished result | candidate search wording | current fit and friction | creative / distribution angle |
|---|---|---|---|---|
| real estate agent returns from a property viewing with three phone walkthrough clips | a short kitchen/living-room/garden sequence for a listing or reel | edit house tour video; make property walkthrough reel; cortar vídeo de imóvel | trim/join/reframe fit; phone-to-desktop transfer is friction; no address captions, logo, or photo animation | show the agent choosing three useful moments; target agent education and real estate marketing guides |
| etsy seller films a handmade item rotating on a table | a short listing video with dead time removed | trim video for etsy listing; cut product video to 15 seconds | strong trim fit; output acceptance needs validation; no photo slideshow | show a long take becoming a short product demonstration; seller tutorials and craft creators |
| small ecommerce seller has several close-ups of a product | one concise demonstration for a product page or social post | combine product video clips; simple product video editor | existing video works; titles, graphics, shoppable links, and background removal are missing | polished before/after product demonstration; merchant newsletters and ecommerce educators |
| restaurant or café owner records preparation, plating, and a finished dish | a short daily-special video | make quick restaurant reel; join food videos online | usable for footage plus owned music; templates and price text are missing | three shots become one meal reveal; local-business educators |
| teacher or trainer has a recording with a long setup at the start | an excerpt explaining one topic | trim lesson recording; cut training video online | short excerpts fit; hours-long sessions and managed-browser restrictions are risks | show removal of setup and pauses; education tool roundups |
| student must submit a recorded presentation | a clean opening and ending without extra takes | cut presentation video; trim mp4 without watermark | strong occasional task; institutional rules and codec compatibility need checks | deadline-focused demonstration; student tool pages and tutorials |
| support engineer prepares a bug reproduction clip | a concise recording without irrelevant steps or background sound | trim screen recording; mute screen recording | good for nonsensitive examples; no blur/redaction tool | show a reproducible issue in one short clip; developer communities |
| freelancer prepares a short client update | a trimmed progress walkthrough with two useful excerpts | edit client update video; join screen recordings | short clips fit; no collaboration or project sharing | actual editing workflow; freelancer newsletters |
| occasional creator wants a moment from a recording | a manually selected short clip | cut clip from video; crop video for reels | manual extraction fits; no auto-captioning or automatic highlight selection | result-first clip extraction; creator education |
| parent or traveler wants a shareable family/travel moment | a shorter joined video or muted clip | combine holiday clips; remove sound from video | short desktop edits fit; phone editors may be more convenient | quiet faceless screen demo; practical consumer tutorials |
| fitness coach has an exercise demonstration | a concise start-to-finish example | trim exercise video; quick workout clip editor | basic trimming fits; no timers, text, or motion tracking | one repetition becomes a clean example; coaching educators |
| community organizer has event footage | a short recap assembled from existing video | merge event clips; make short event recap | simple assembly fits; no poster/photo import or branded templates | before/after recap; community and nonprofit resource lists |

### stronger vertical evidence

nar's 2025 technology survey reports social-media use by 75% of responding realtors.
it also reports drone photography/video use by 52%.
this establishes workflow relevance, not demand for viewkit or a count of editor searches. [nar survey announcement](https://www.nar.realtor/press-releases/realtors-embrace-ai-digital-tools-to-enhance-client-service-nar-survey-finds)

one agent explicitly asks for basic editing of sub-30-second social content.
their phone/mac workflow also exposes viewkit's desktop acquisition friction. [agent discussion](https://www.reddit.com/r/VideoEditing/comments/1js124k)

etsy currently specifies listing videos of 3–15 seconds and removes audio after upload.
this creates a concrete short-trimming use case. it does not prove sellers need another editor. [etsy listing-video requirements](https://help.etsy.com/hc/en-gb/articles/360053206073-How-to-Add-Listing-Videos)

shopify describes product demonstrations and social product videos as ecommerce formats.
viewkit can prepare existing footage, but cannot create shoppable interactions. [shopify use cases](https://www.shopify.com/blog/types-of-video-marketing)

### initial targeting recommendation

1. student/teacher presentation trimming: narrow task, easy demonstration, occasional usage.
2. seller product-video trimming and joining: specific output, potential repeat usage.
3. agent walkthrough excerpts: recognizable occupational need, with more missing-feature and device friction.

test each with a separate landing-page story and demo.
agents remain a candidate segment until desktop usage and demand for text/photos are understood.
do not treat every occupation as a separate additive market. the same person may occupy several roles.

## 5. demand validation before mass distribution

### first two weeks

- inspect about 50 query variants across the initial jobs, occupations, english, and brazilian portuguese.
- collect 20 relevant community examples with dates, context, desired outputs, and existing alternatives.
- interview 20 people: five sellers, five agents, five education users, and five other occasional editors.
- ask about their last actual edit, search phrase, device, failed tool, time spent, and acceptable export tradeoff.
- recruit 30 observed task attempts across the three initial segments.
- use participant-owned or licensed nonsensitive footage. record editing outcomes, not private media or filenames.

these are proposed research activities. only the public desk research in this report has been performed.

### keyword evidence sheet

capture query, country, language, monthly-search range, seasonality, result types, competing pages, and product fit.
also capture device mix where available, destination task, and actual export conversion after launch.

keyword planner includes close variants and depends on geography/network settings.
its competition field measures advertiser competition, not organic ranking difficulty. [google historical metrics](https://support.google.com/google-ads/answer/3022575?hl=en)

google trends reports normalized relative interest, not monthly search totals. [trends methodology](https://support.google.com/trends/answer/4365533?hl=en)

deduplicate synonyms before summing demand. keep screenshots or exports with dates and settings.
prefer a relevant narrow query over a large query requiring missing capabilities.
no monthly search volume or keyword difficulty is asserted here.

## 6. seo plan from tasks to pages

| job cluster | english seeds | portuguese seeds | proposed primary page | proof required |
|---|---|---|---|---|
| cut/trim | trim video online; cut mp4; trim video without uploading | cortar vídeo online; recortar começo de vídeo | /trim-video | one imported clip, visible trim, working export |
| join | merge short videos; join video clips online | juntar vídeos; unir clipes de vídeo | /merge-videos | sequential clips and complete output |
| mute | mute video online; remove sound from video | tirar som do vídeo; silenciar vídeo | /mute-video | volume zero; explain that export may retain a silent audio track |
| reframe | crop video for reels; change video aspect ratio | cortar vídeo para reels; mudar proporção do vídeo | /crop-video | manual stage sizing and framing; no automatic subject tracking claim |
| rotate | rotate video online; fix sideways video | girar vídeo online | /rotate-video | orientation adjustment without unsupported quality claims |
| general utility | video editor no upload; video editor no signup | editor de vídeo sem upload; sem cadastro | /video-editor | accurate local-processing and ad-supported-export explanation |

paths are proposals, not existing published routes.
support english first. add portuguese pages after language-fit research and a localization decision.

### human story pages

begin with three detailed guides: trim a presentation, prepare a product listing video, and cut a property walkthrough.
each guide needs its own example, input constraints, editing steps, and downloadable sample result.
use the relevant task page as its editor entry.
an agent guide must acknowledge missing titles, branding, and photo animation.

do not create dozens of near-identical occupation pages before the scenarios are validated.
google describes doorway pages, scaled low-value content, and ranking-focused link schemes as spam. [search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

### implementation backlog for discoverability

- give task pages useful crawlable html, distinct titles, descriptions, and a visible editor entry.
- include concise instructions, screenshots, constraints, and one genuine example.
- add canonical urls, a sitemap, internal task links, and accurate supported-format information.
- keep heavy editor code out of the initial reading path where practical.
- validate page speed, keyboard access, indexing, and desktop routing before promoting pages.
- publish measured compatibility and export findings when actual tests exist.
- use structured data only when it accurately describes visible content and supported eligibility.

these are future implementation proposals. current source changes are outside this research task.

### links, references, and review partnerships

shortlist 40 relevant pages or publishers across video utilities, agents, sellers, education, and developer workflows.
offer an independent review kit: product access, licensed sample footage, screenshots, limitations, and real benchmark results when available.
suggest inclusion where viewkit solves the page's actual task. do not dictate a positive review.

aim initially for 5–10 useful earned references, with actual referred exports as the success measure.
other candidates include educator resource pages, merchant newsletters, and complementary tool directories.
publish a useful compatibility table or editing benchmark that another author might reasonably cite.

paid placements buy exposure, not guaranteed ranking credit. qualify compensated links appropriately.
avoid automated backlink creation and reciprocal link quotas. [google link guidance](https://developers.google.com/search/docs/essentials/spam-policies#link-spam)

## 7. minimum viable distribution

### what “ghost” means in this plan

use faceless screen recordings, hands-only demonstrations, and creator-style production without requiring a founder on camera.
use legitimate brand, founder, localized, and contracted creator accounts with clear affiliations.
do not fabricate independent users, testimonials, or apparently spontaneous recommendations.

paid creator relationships need clear disclosure for audiences covered by applicable rules. [ftc influencer guidance](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers)

reddit restricts unsolicited repetitive mass engagement.
x restricts coordinated inauthentic amplification and duplicate content across operated accounts.
these facts affect distribution durability. [reddit spam policy](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam), [x authenticity policy](https://help.x.com/en/rules-and-policies/authenticity)

### pilot, then scale

start with one recognizable brand identity across relevant platforms, plus a disclosed founder account and 3–5 actual creators.
add occupation-specific or localized accounts only when they serve distinct audiences and fit platform rules.
maintain a ledger of account owner, audience, affiliation, creative rights, and attributed outcomes.
do not use account count as a growth metric.

| channel | useful native format | initial audience / task | conversion route |
|---|---|---|---|
| tiktok | short task demonstration or actual creator workflow | sellers and occasional creators | task-specific profile link; desktop handoff must be clear |
| instagram | reels, before/after carousel, screenshot cards | agents, local businesses, product sellers | relevant guide or editor page |
| youtube | shorts plus searchable walkthroughs | people looking for the editing steps | tutorial description and supported editor entry |
| threads | compact story, screenshot sequence, useful reply | casual creators and small businesses | one relevant task link when appropriate |
| x/twitter | concise screen demo, developer workflow, benchmark explanation | freelancers and support/developer users | trim or mute page |
| reddit | contextual tutorials, permitted feedback posts, specific answers | relevant beginner and occupational communities | disclosed link only where rules and context allow |

for real estate, also interview agents about facebook groups and linkedin.
add those channels only if users report finding tools there and local community rules permit participation.
platform attention does not establish desktop editing intent.

### scaled annual content hypothesis

produce about 300 original creative units across 50 working weeks.
adapt those into approximately 1,200 distribution placements, rather than posting identical copies from an account farm.

| destination | annual planning ceiling |
|---|---:|
| tiktok | 300 |
| instagram | 300 |
| youtube, including some longer tutorials | 300 |
| threads | 120 |
| x/twitter | 120 |
| reddit, only eligible contextual contributions | 60 |
| total | 1,200 |

these counts are a workload scenario, not recommended platform limits or guaranteed reach.
adapt the example, opening, format, caption, and destination to each audience.
do not coordinate artificial comments, likes, votes, or fabricated conversations.
stop formats that generate views without qualified imports and successful exports.

## 8. creative styles and messages

| style | example creative | why it might work | honesty rule |
|---|---|---|---|
| result-first recording | finished 12-second product clip, followed by the trim that created it | makes the task concrete | use an actual exported result |
| real creator workflow | a seller edits their own product demonstration | connects the tool to a working person | disclose compensation; do not script invented satisfaction |
| faceless walkthrough | screen recording of three property clips becoming one excerpt | avoids founder-camera dependency | show the actual feature set |
| screenshot / print card | timeline screenshot with one visible edit and one outcome label | useful for feeds and carousels | avoid fake statistics and fake user counts |
| before/after carousel | setup footage versus clean presentation opening | communicates a small, understandable improvement | keep material comparable |
| polished promotional video | clean interface close-ups and a licensed product demonstration | establishes product presentation quality | polished editing must not imply missing app features |
| occupational mini-story | agent prepares tomorrow's property walkthrough excerpt | creates identification with a real situation | no promised leads or sales outcomes |
| search tutorial | how to trim an etsy listing video or mute a recording | attracts active problem-solving intent | disclose relevant platform and browser constraints |

initial creative mix: 40% faceless task demos, 25% genuine creator workflows, 20% screenshots/carousels, and 15% polished promotion.
this allocation is a test assumption, not evidence that one style converts better.

sample openings:

- “three property clips. one short walkthrough.”
- “keep the product. cut the setup.”
- “your presentation starts here. remove everything before it.”
- “mute the background sound before sending this recording.”

end with one relevant action, such as “trim your clip.”
show the ad-supported export condition before users invest editing effort.
avoid permanent five-second promises until a real provider's format and timing are known.

## 9. current monetization hypothesis

the current flow is edit → export → choose watch ad → simulated countdown → render → download.
the proposed business model replaces the countdown with a real approved advertisement and reward callback.
editing remains free, with an ad requested for each independent export under the present hypothesis.

### ad delivery and product requirements

google ad manager supports rewarded advertising on desktop web. [web inventory documentation](https://support.google.com/admanager/answer/9116812?hl=en)
this does not mean the present export gate or reward is approved.
google's rewarded policies require voluntary participation and say refusal must not interfere with normal platform usage.
reward eligibility also has restrictions, including non-transferability. [reward policies](https://support.google.com/admanager/answer/7496282?hl=en)

blocking the primary export function raises a substantive provider-fit question.
a downloadable video reward also needs explicit interpretation from the selected provider.
obtain approval before depending on this implementation for revenue.
if approval or inventory is unavailable, assume $0 ad revenue.

proposed production requirements:

- determine reward eligibility and refusal behavior with the provider.
- use actual readiness, completion, reward, cancellation, and failure events; never a local timer as proof of payment.
- provide a usable no-fill/ad-block fallback without losing the user's edit.
- preserve a credited export entitlement after a technical render failure, allowing retry without another ad.
- keep a clear cancel path and disclose the exchange before editing starts.
- use an isolated ad placement and required consent handling; do not expose imported media or filenames.
- measure mobile visitors separately and avoid advertising a supported mobile editor before it exists.

optional experiments include ad-free paid access or a provider-approved optional reward above an ungated basic export.
these would change product scope and monetization behavior. they are proposals, not implemented features.

### unit economics

use this transparent funnel:

```text
site visits
× editor-open rate
× successful-import rate
× export-ready rate
× independent export requests per export-ready project
× ad acceptance
× ad fill
× credited completion rate
= credited completed ad views

credited completed ad views × realized yield / 1,000 = ad revenue
```

realized yield here means net publisher receipts per 1,000 credited completed views.
it is an effective planning measure, not a quoted network cpm or advertiser purchase price.
the model conservatively ignores revenue from incomplete impressions.
do not multiply a published provider ecpm by completion again without reconciling its denominator.
technical export retries do not count as additional independent monetization opportunities.

| assumption / result | conservative | base | stretch |
|---|---:|---:|---:|
| annual site visits | 30,000 | 176,000 | 1,500,000 |
| editor opens / visit | 35% | 45% | 60% |
| successful imports / editor open | 50% | 60% | 70% |
| export-ready projects / successful import | 50% | 65% | 80% |
| independent exports / export-ready project | 1.1 | 1.3 | 1.6 |
| ad acceptance / export request | 60% | 75% | 85% |
| ad fill / accepted request | 50% | 75% | 90% |
| credited completion / filled request | 80% | 90% | 95% |
| realized yield / 1,000 credited views | $3 | $8 | $15 |
| successful imported projects | 5,250 | 47,520 | 630,000 |
| credited completed ad views, rounded | 693 | 20,328 | 586,051 |
| annual ad revenue | $2.08 | $162.63 | $8,790.77 |
| revenue / 1,000 site visits | $0.069 | $0.924 | $5.861 |

every rate and yield in this table is an assumption. country mix, consent, blockers, invalid traffic, and commercial terms change outcomes.
“base” identifies the working spreadsheet scenario; it is not the most likely outcome.
the stretch case combines large reach with strong conversion and yield. it is deliberately demanding.

the base funnel requires successful imports from 27% of all visits; stretch requires 42%.
those rates require at least that much compatible desktop traffic.
if 80% of arrivals are unsupported mobile visitors, even perfect remaining conversion cannot produce the base import rate.
measure device-qualified traffic before increasing short-form distribution spending.

### costs and break-even

| annual cash allocation | proposed cap |
|---|---:|
| hosting, domain infrastructure | $300 |
| analytics and operational tooling | $300 |
| keyword/research tooling | $480 |
| creator contributions | $1,800 |
| editing and creative assistance | $1,800 |
| ad setup and launch reserve | $600 |
| contingency | $720 |
| total cash budget | $6,000 |

allocations are budget hypotheses, not vendor quotations.
at 600 founder hours valued at $20/hour, labor adds $12,000. total economic cost becomes $18,000.
one workload allocation is 300 production hours, 100 distribution hours, 120 search hours, and 80 partnership/measurement hours.

the base case needs approximately 6.49 million annual visits to cover $6,000 cash cost.
including the labor assumption raises that threshold to 19.48 million visits.
the stretch funnel needs approximately 1.02 million visits for cash break-even.
its $8,791 revenue covers cash costs, but not the $18,000 economic cost.

at base conversion, a paid visit earns approximately $0.000924 from this model.
paid acquisition should not scale against that revenue without demonstrated repeat lifetime value or another revenue source.
organic acquisition also needs cost accounting; production is not free because impressions are unpaid.

as a separate experiment, 2% of base active users paying $19/year produces roughly $12,038 in gross cash receipts.
with an illustrative 20% fee/refund/support reserve, that leaves about $9,631 before other costs and taxes.
the 2% conversion, price, reserve, and willingness to pay are unvalidated.
payment infrastructure and ad-free entitlements do not currently exist.
this paid scenario replaces ad exposure for paying users; do not simply add it to unchanged ad revenue.
annual subscription cash receipts also differ from revenue recognized over the subscription period.

## 10. tam, sam, and first-year som

### definitions and evidence limits

tam: people worldwide with an annual short, basic video-editing need compatible with the product category.
sam: the part compatible with the current desktop/browser scope, proposed language reach, and actual feature set.
som: active people the first-year distribution scenarios could acquire, rather than arbitrary percentages of the internet.
an active person here means someone who successfully imports footage into an editing project.

itu estimates approximately 6 billion internet users in 2025.
that is the population anchor, not the number of video-editor buyers. [itu statistics](https://www.itu.int/en/ITU-D/Statistics/Pages/stat/default.aspx)

the remaining population filters below are explicit hypotheses.
no reliable measured category-user count was established by this research.

### illustrative population model

| stage | calculation | result |
|---|---|---:|
| internet population anchor | published 2025 estimate | 6 billion |
| annual category need | anchor × assumed 2% | 120 million tam people |
| desktop and supported-browser suitability | tam × assumed 25% | 30 million |
| initial english/portuguese accessibility | previous × assumed 35% | 10.5 million |
| current feature/task fit | previous × assumed 40% | 4.2 million sam people |

these sequential filters are conditional assumptions; they are not measured independent probabilities.
language accessibility includes a possible future portuguese launch and must be replaced with actual launch coverage.
an english-only launch needs a revised factor.

if annual category need ranges from 0.5% to 5%, tam becomes 30–300 million people.
holding the other assumptions fixed gives sam of 1.05–10.5 million people.
these wide ranges show uncertainty. they are not statistical confidence intervals.

### ad revenue capacity, not software subscription spend

assume six export requests per active category person per year for a mature service.
at 75% acceptance, 75% fill, 90% credited completion, and $8 realized yield:

```text
annual revenue per active person = 6 × 0.75 × 0.75 × 0.90 × $8 / 1,000
                                = $0.0243

illustrative tam annual ad capacity = 120,000,000 × $0.0243 = $2,916,000
illustrative sam annual ad capacity =   4,200,000 × $0.0243 =   $102,060
```

these amounts assume the service captured every person in each market and obtained eligible ad demand.
they are conditional monetizable capacity, not an externally measured advertising market.
the six-request mature-use assumption is not applied to first-year acquisition cohorts.
do not substitute creator-economy or advertising-industry revenue for viewkit's addressable export revenue.

### acquisition-based first-year som

assume 1.5 successfully imported projects per active person during year one.
divide modeled successful imported projects by 1.5, rather than calling every site visit a user.

| scenario | approximate active people | share of illustrative 4.2m sam | ad revenue |
|---|---:|---:|---:|
| conservative | 3,500 | 0.083% | $2.08 |
| base | 31,680 | 0.754% | $162.63 |
| stretch | 420,000 | 10.0% | $8,790.77 |

the project-per-person ratio is unmeasured. multi-device usage makes anonymous person counts approximate.
420,000 active people would be an exceptional first year for this proposed small team.
the base case already depends on meaningful search acquisition, which has not been demonstrated.

occupation-specific audiences are overlapping acquisition segments within sam.
do not add all agents, sellers, teachers, students, and creators together as separate markets.
nar's occupational survey and etsy's video specification establish use-case relevance, not those audiences' editor-search counts.

### occupational population cross-check

etsy reported 5.6 million active marketplace sellers at december 31, 2025 in its annual filing.
this is a dated audited population anchor, not the latest seller count or a count of video-editing demand. [etsy 2025 annual filing](https://investors.etsy.com/sec-filings/all-sec-filings/content/0001370637-26-000019/etsy-20251231.htm)

assuming 10% need an external short-video edit annually gives 560,000 potential job holders.
assuming 30% meet device, language, and current-feature requirements leaves 168,000 eligible sellers.
both filters are unvalidated; existing phone tools could reduce the need sharply.
these sellers are a possible subset of global sam, not an additional market to add onto it.
at the mature-use ad assumptions, this entire niche represents about $4,082 in annual ad capacity.
occupation-specific demand may support paid access better than the current one-ad utility model.

## 11. where base traffic would come from

| traffic source | annual base hypothesis | basis and uncertainty |
|---|---:|---|
| organic social | 36,000 visits | 1,200 placements × 5,000 average impressions × 0.6% attributed visit rate |
| google search | 100,000 visits | hypothetical page portfolio and ranking ramp; no verified search-volume basis |
| reviews, tutorials, and partnerships | 20,000 visits | earned referrals; partners have not been recruited |
| direct/return sessions | 20,000 visits | retained usage; not 20,000 additional unique people |
| total | 176,000 visits | source categories must be mutually exclusive in reporting |

average social reach includes a possible viral tail. it does not mean each post receives 5,000 impressions.
cross-platform impressions include repeat exposure; they are not unique people.
do not add creator referrals to organic social if already attributed there.

| quarter | social | search | partnerships | direct/return | total visits |
|---|---:|---:|---:|---:|---:|
| q1 | 4,000 | 2,000 | 1,000 | 500 | 7,500 |
| q2 | 8,000 | 18,000 | 3,000 | 2,500 | 31,500 |
| q3 | 10,000 | 30,000 | 6,000 | 5,000 | 51,000 |
| q4 | 14,000 | 50,000 | 10,000 | 12,000 | 86,000 |
| year | 36,000 | 100,000 | 20,000 | 20,000 | 176,000 |

this is a planning ramp, not a claim that new pages rank on this schedule.
if search delivers only 20,000 visits, total visits fall to 96,000 with other inputs unchanged.
the base funnel then earns approximately $88.70 annually.

## 12. first-year execution and decision gates

| period | minimum output | gate before increasing effort |
|---|---|---|
| weeks 1–2 | research sheet, 20 interviews, 30 task attempts, three persona stories | identify an actual repeatable job and supported device workflow |
| weeks 3–6 | three task pages, 12–18 original creatives, instrumentation plan, provider discussion | at least one segment completes real exports; provider eligibility understood |
| weeks 7–12 | up to six task pages, creator pilot, several relevant review pitches | 1,000 qualified site visits; analyze import, export, and gate abandonment |
| months 4–6 | retain winning jobs and channels; collect measured ad outcomes if approved | usable export success ≥90% on supported task attempts; enough credited views to assess yield |
| months 7–9 | expand demonstrated guides and creator relationships | measured revenue and acquisition cost support the additional workload |
| months 10–12 | refresh evidence, consider localization or paid access experiments | scale only a repeatable profitable or deliberately funded learning path |

proposed first-90-day cash cap: $1,500. the full $6,000 annual budget depends on passing the gates.
the scaled content ceiling is conditional; missing gates reduce output instead of forcing mass posting.

collect at least 1,000 credited views across relevant geography/device cohorts before trusting a yield estimate.
even that sample may miss seasonality and small-market inventory variation.
after 200 export requests, inspect acceptance and abandonment; do not infer stable market behavior from a few completions.

review thresholds are proposed working criteria, not statistically established guarantees.
change the model when observations disagree with the inputs.
if ad economics remain below content cost, test paid ad removal or narrower commercial workflows before increasing account count.

### measurement and source of truth

planned events: task-page view, editor open, successful import, export request, ad accepted, ad filled, reward credited, render completed, download initiated.
also count refusal, no-fill, render failure, unsupported device, and a return editing session.
download initiation does not prove a file was saved or watched.

use campaign ids identifying persona, job, creative, account, platform, and landing page.
report cost per successfully imported project and successful export, plus realized revenue per 1,000 visits.
separate ads earned from completed downloads and distinguish cash receipts from projected revenue.
never collect source footage, filenames, or private project content for marketing analytics.
analytics, consent handling, and provider integration are proposed work, not current instrumentation.

## 13. review record

### inventory and review dimensions

| id | item | dimensions | first-pass disposition |
|---|---|---|---|
| r01 | current capabilities and export flow | scope, compatibility, claim accuracy | covered through code and governing records |
| r02 | qualitative demand and human scenarios | source quality, task fit, occupation/device context | covered; interviews and search demographics remain unavailable |
| r03 | search pages and review partnerships | intent, feature coverage, duplication, attribution | proposed; keyword volumes unavailable |
| r04 | social accounts and creative styles | audience, production cost, authenticity, conversion | proposed; campaign evidence unavailable |
| r05 | export ads | eligibility, refusal, callbacks, no-fill, retries | provider approval and real yield unresolved |
| r06 | tam/sam/som and economics | units, overlap, conditional assumptions, acquisition dependency | computed; unmeasured inputs clearly labeled |

### first pass findings

- f01 — missing evidence: search volumes, buyer/device mix, retention, and keyword difficulty are unmeasured.
  resolution: collect the research sheet and live funnel before describing demand as validated.
- f02 — provider-fit risk: a mandatory export gate is not established as an eligible rewarded implementation.
  resolution: obtain provider approval and define usable refusal/no-fill behavior.
- f03 — economic constraint: one export ad yields too little to fund ordinary paid acquisition under the base assumptions.
  resolution: calculate costs per qualified export, then test repeat usage or additional monetization.
- f04 — product mismatch: many occupational videos require text, photos, captions, templates, or mobile editing.
  resolution: advertise only the demonstrated subset and record missing needs during interviews.

- f05 — acquisition mismatch: mobile-heavy feeds can make the base and stretch import rates impossible.
  resolution: segment desktop-qualified arrivals and validate agent/seller device workflows before scaling.
- f06 — unsupported market precision: population filters and use frequency dominate tam/sam/som results.
  resolution: retain wide ranges and collect occupation-specific editing incidence and search-volume evidence.

### distinct second pass

performed after the first document was written, using counterexamples and reverse financial tracing.

- re-read current exporter and native-render code: advertisements are simulated; output re-encodes at fixed fps.
- traced base visits through projects, export requests, accepted ads, filled requests, credited views, and receipts.
- recomputed scenario totals, cash budget, content placements, quarter/source totals, and break-even from independent formulas.
- challenged social conversion with an 80% mobile-arrival counterexample and added the required device-share bounds.
- challenged occupation targeting with agents needing titles/photos and etsy sellers already having phone trimming.
- added a dated occupational population cross-check without summing overlapping audiences into global sam.
- checked provider conditions against mandatory gating and retry behavior; approval remains unresolved.
- distinguished subscription cash receipts from recognized revenue and prevented double-counting paid users' ad exposure.
- revisited search dependence: reducing base search traffic yields approximately $88.70 annual ad revenue.

### checks and handoff

| check | method | result |
|---|---|---|
| requested scope | trace demand, human scenarios, ad model, social platforms, creative styles, seo, partnerships, and year-one sizing | covered in this report |
| arithmetic | javascript calculations and reverse funnel reconciliation | reported values reconcile, subject to rounding |
| public claims | direct provider, vendor, survey, and market-source reads | citations attached; community evidence labeled anecdotal |
| current capability boundaries | governing records and renderer/export source inspection | missing features and compatibility boundaries retained |
| quantitative demand, conversion, and yield | keyword accounts, interviews, live campaign and provider data | unavailable; no validation claim |

desk research and scenario modeling are complete for the declared scope.
actual monetization viability remains unproven.
next action: founder runs the two-week demand pilot and resolves provider eligibility before funding scaled distribution.
