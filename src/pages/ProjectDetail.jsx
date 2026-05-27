import { useState, Suspense, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { getProjectById } from '../data/projects'
import BlueprintViewer from '../components/BlueprintViewer'
import RVTViewer from '../components/RVTViewer'
import GlbViewer from '../components/GlbViewer'
import { useTheme } from '../context/ThemeContext'
import './ProjectDetail.css'

function ProjectDetail({ embedded, projectId: projectIdProp, onClose }) {
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const id = embedded && projectIdProp != null ? projectIdProp : routeId
  const project = getProjectById(id)
  const [activeView, setActiveView] = useState('overview')
  const [selectedBlueprint, setSelectedBlueprint] = useState(null)
  const [sustainabilityMode, setSustainabilityMode] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setEntered(true), 20)
    return () => clearTimeout(id)
  }, [])

  if (!project) {
    const isAirport = id === 'airport'
    return (
      <div className="project-not-found" data-theme={theme}>
        <h2>{isAirport ? 'Airport' : 'Project not found'}</h2>
        {isAirport && <p>Coming soon (Graduation project 2026/27)!</p>}
        {embedded && onClose ? (
          <button type="button" onClick={onClose}>Close</button>
        ) : (
          <Link to="/world">Return to World</Link>
        )}
      </div>
    )
  }

  if (project.buildingType === 'museum') {
    return <MuseumOfLovingMaram embedded={embedded} onClose={onClose} theme={theme} />
  }

  const isDay = theme === 'day'
  const images = project.images || []

  return (
    <div
      className={`project-detail project-detail-enter ${entered ? 'entered' : ''}`}
      data-theme={theme}
    >
      {/* Voxel grid background + optional building silhouette */}
      <div className="project-detail-bg" aria-hidden="true">
        <div className="voxel-grid-bg" />
        <div className="building-silhouette" data-building={project.buildingType} />
      </div>

      {/* Title + description always under title; metadata right */}
      <header className="project-header">
        <div className="project-header-left">
          <h1 className="project-title">{project.title}</h1>
          <p className="project-description-under-title">{project.description}</p>
        </div>
        <div className="project-meta-stack">
          <div className="meta-box">
            <span className="meta-label">Year</span>
            <span className="meta-value">{project.year}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">Type</span>
            <span className="meta-value">{project.concept}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">Location</span>
            <span className="meta-value">{project.location}</span>
          </div>
          {project.designDuration && (
            <div className="meta-box meta-box-accent">
              <span className="meta-label">Duration</span>
              <span className="meta-value">{project.designDuration}</span>
            </div>
          )}
        </div>
      </header>

      {/* Nav: voxel-style buttons */}
      <nav className="project-nav">
        <button
          className={`nav-tab ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeView === 'blueprints' ? 'active' : ''}`}
          onClick={() => setActiveView('blueprints')}
        >
          Blueprints
        </button>
        <button
          className={`nav-tab ${activeView === '3d' ? 'active' : ''}`}
          onClick={() => setActiveView('3d')}
        >
          3D Model
        </button>
        {images.length > 3 && (
          <button
            className={`nav-tab ${activeView === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveView('gallery')}
          >
            Gallery
          </button>
        )}
        <button
          className={`sustainability-btn ${sustainabilityMode ? 'active' : ''}`}
          onClick={() => setSustainabilityMode(!sustainabilityMode)}
          title="X-ray Vision"
        >
          🌱
        </button>
      </nav>

      <main className="project-content">
        {activeView === 'overview' && (
          <div className="overview-section">
            {/* Overview: first 3 pictures + "See more pictures" (clear of close button) */}
            <div className={`project-images voxel-image-grid ${images.length <= 1 ? 'single-image' : ''}`}>
              {images.slice(0, 3).map((src) => (
                <div key={src} className="image-block">
                  <div className="image-frame">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
            {images.length > 3 && (
              <button
                type="button"
                className="see-more-pictures"
                onClick={() => setActiveView('gallery')}
              >
                See more pictures
              </button>
            )}

            {sustainabilityMode && (
              <div className="materials-section">
                <h3>Materials</h3>
                <div className="materials-grid">
                  {project.materials.sustainable?.length > 0 && (
                    <div className="material-category green">
                      <h4>Sustainable</h4>
                      <ul>
                        {project.materials.sustainable.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.materials.reused?.length > 0 && (
                    <div className="material-category amber">
                      <h4>Reused</h4>
                      <ul>
                        {project.materials.reused.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.materials.experimental?.length > 0 && (
                    <div className="material-category red">
                      <h4>Experimental</h4>
                      <ul>
                        {project.materials.experimental.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'gallery' && (
          <div className="gallery-section">
            <h3 className="gallery-section-title">All pictures</h3>
            <div className="project-images voxel-image-grid project-gallery-all">
              {images.map((src) => (
                <div key={src} className="image-block gallery-item">
                  <div className="image-frame">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'blueprints' && (
          <div className="blueprints-section">
            <div className="blueprints-grid">
              {(project.blueprints || []).map((blueprint, index) => (
                <button
                  key={index}
                  type="button"
                  className="blueprint-card"
                  onClick={() => setSelectedBlueprint(blueprint)}
                >
                  <span className="blueprint-icon">📐</span>
                  <h4>{blueprint.name}</h4>
                  <p>Click to view</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeView === '3d' && (
          <div className="model-viewer-section">
            {project.model3d?.glbOrGltf ? (
              <>
                <GlbViewer url={project.model3d.glbOrGltf.downloadUrl} />
              </>
            ) : project.rvtFile || project.model3d?.rvt ? (
              <>
                <RVTViewer rvtFile={project.rvtFile || (project.model3d?.rvt && { url: project.model3d.rvt.downloadUrl, name: project.model3d.rvt.name })} />
                <div className="model-badge needs-conversion" role="status">
                  .rvt cannot be viewed in browser. Export to .glb for 3D view.
                </div>
              </>
            ) : (
              <div className="placeholder-3d">
                <Canvas shadows gl={{ antialias: true }} className="model-canvas">
                  <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
                  <ambientLight intensity={0.4} />
                  <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
                  <pointLight position={[-10, 5, -10]} intensity={0.4} color="#d4af37" />
                  <Suspense fallback={null}>
                    <Environment preset="night" />
                    <mesh castShadow receiveShadow>
                      <boxGeometry args={[4, 6, 4]} />
                      <meshStandardMaterial color="#8b7355" metalness={0.3} roughness={0.6} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                      <planeGeometry args={[20, 20]} />
                      <meshStandardMaterial color="#1a1a1a" />
                    </mesh>
                  </Suspense>
                  <OrbitControls enablePan enableZoom enableRotate minDistance={5} maxDistance={20} />
                </Canvas>
                <div className="placeholder-text">
                  <p>3D Model will be displayed here</p>
                  <p className="hint">Add a .glb or .gltf in Photos and 3D, or export from Revit</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {embedded && onClose ? (
        <button type="button" className="back-button" onClick={onClose}>← Close</button>
      ) : (
        <button type="button" className="back-button" onClick={() => navigate('/world')}>
          ← Return to World
        </button>
      )}

      {selectedBlueprint && (
        <BlueprintViewer
          blueprint={selectedBlueprint}
          onClose={() => setSelectedBlueprint(null)}
        />
      )}
    </div>
  )
}

export default ProjectDetail

const museumDoors = [
  { title: 'Before You', unlocked: true, tone: 'moonlit', unlock: 'Enter', symbol: 'I', roomId: 'before-you' },
  { title: 'Little Things', unlocked: true, tone: 'gold', unlock: 'Enter', symbol: 'II', roomId: 'balloon-notes' },
  { title: 'The Rule of Three', unlocked: true, tone: 'amber', unlock: 'Enter', symbol: 'III', roomId: 'rule-of-three' },
  { title: 'The Poem That Answers Back', unlocked: true, tone: 'rose', unlock: 'Enter', symbol: 'IV', roomId: 'poem-answers' },
  { title: 'Arafah', unlocked: true, tone: 'starlit', unlock: 'Enter', symbol: 'V', roomId: 'arafah' },
  { title: '100 Years of Adventure', unlocked: true, tone: 'violet', unlock: 'Enter', symbol: 'VI', roomId: 'adventure-book' },
  { title: '100 Years Together', unlocked: false, tone: 'sacred', unlock: 'Opens May 29', symbol: 'VII' },
]

const beforeYouPoem = `Before I knew your name,
life was crowded. Loud, Aflame.
Rooms overflowed. The tables wide,
yet something starving lived inside.

I laughed the loudest in the hall,
that boy they swore could charm them all.
I wore my joy like borrowed clothes,
while emptiness beneath it froze.

Room 206 would breathe at night,
drowned in smoke and restless light.
Voices crashing wall to wall,
yet somehow I was not there at all.

The laughter rang, the music swayed,
young hearts performed, young egos played.
And there I stood among the noise,
a mighty king surrounded by his toys?

I thought that this was what life meant:
A loud applause. A quick event.
A racing pulse. A sleepless high,
Never asking myself how or why.

But darkness is the patient part,
it builds a new home inside my heart.
Sometimes a boy can glow for years
while quietly dissolving into cheers.

Then came that corridor one night,
half asleep in silver light.
The music room. The whole school.
The air so cold, the dark so blue.

And there you were.
So simple. Unaware.
As if God had hidden spring itself
inside a girl with midnight hair.

No orchestra announced your face.
No thunder split the sky in place.
Yet when your fingers touched my hand,
something eternal chose to land.

A simple touch. A passing thing.
No violins or flutes began to sing.
Yet when your hand fell into mine,
the stars rearranged their design.

And Oh God, how strange the air became,
how suddenly I just knew my name.
As if my chest, for all those years,
had only borrowed breath and gears.

I carried that touch for months like fire,
a quiet wound, a sacred wire.
I replayed it before I’d sleep,
the way starving men remember feast.

Before you, mornings used to pass
like trains disappearing behind glass.
Now dawn itself began to bloom
because one day it might lead to you.

I used to worship crowds and noise,
the reckless glow of boys with boys.
Now place me where your soul is not,
and every color starts to rot.

My friends still laugh the way they did,
repeat the same old drunken bits.
But if your name is not somewhere near,
their voices fade against my ear.

I became the boy who checks his phone
in rooms where he once ruled alone.
The boy who leaves the brightest place
just to wait for your typing pace.

And God, how deeply you have grown
through every corner I call home.
You live inside my smallest ways,
inside my work, my nights, my days.

At work, while people speak and move,
I build our future in my head like truth.
Curtains dancing in softened light,
your sleepy voice at two past night.

You do not know how much you changed.
How every wire rearranged.
How ambition bent its knee
the moment it included “we.”

I wait for your replies like a flower waits for rain,
like deserts ache through months of pain.
One little notification sound
could pull my world back around.

You became my favorite place.
My silence. My escape. My grace.
Not just the girl I wished to hold,
but the first warmth in a freezing world.

And if you built a cage from your arms,
I would mistake those bars for stars.
Lock every door and keep the key,
The only freedom with you near me.`

const balloonNotes = [
  `The way your voice gets softer with me compared to literally anyone else.`,
  `I love when you come complaining to me. You always act like your problems are annoying me while I’m secretly hoping you keep talking for another hour.`,
  `Your reels are terrible. Keep sending them.`,
  `Nah nah your reels are genuinely the second cutest thing in my life after the girl sending them.`,
  `The amount of patience you have with my late replies because of work still surprises me. You give me grace in a world that rushes everyone.`,
  `The way you get happy over tiny things I do makes me want to keep doing more for you forever.`,
  `Your face when you join a call with me makes me feel like I won life!`,
  `Your emoji-filled messages after I get you something look like happiness typed out.`,
  `Your snap hauls deserve professional production and three seasons minimum.`,
  `Even when you’re angry, you still sound cute. It’s actually unfair.`,
  `Every fit you wear becomes my new favorite fit.`,
  `The way you say yes first then panic later about how you’re actually going to do it.`,
  `YOUR EYES`,
  `The way you immediately come to me when stressed. Very smart and beautiful decision by the way.`,
  `You speak at x4 speed and expect my brain to keep up.`,
  `Your movie taste is elite.`,
  `Your series taste needs prayer.`,
  `Your random songs always end up attached to memories now.`,
  `Your random “I love you” texts fix days you didn’t even know were bad.`,
  `14-hour Discord calls still somehow feel short.`,
  `The way you get excited over gifts makes me feel like I bought you the moon even if it was something small.`,
  `Sleeping while hearing your voice gives me the calmest sleep ever.`,
  `YOUR DRESSES.\nThat’s it. That’s the note.`,
  `I still think you’re prettier than every person I’ve seen in every country I’ve visited.`,
  `The way you confidently pronounce words wrong then defend them like your life depends on it.`,
  `The way you look at my lips while I’m talking.Yes I notice.`,
  `I love how you get interested in literally anything I care about.`,
  `The way you ask me to teach you things is one of the cutest things ever.`,
  `You became my princess so naturally that neither of us even questioned it.`,
  `The innocent child inside you is my favorite part of you.`,
  `Your wink attempts kill me every single time.`,
  `I love when you randomly send selfies just to show me what you’re doing.`,
  `Your tone with me is completely different from your tone with everyone else and I notice it every time.`,
  `The juice you drink during movie nights became part of the memory itself.`,
  `The way you take care of your nails`,
  `The fact you watch the horrible videos I send while I eat fast just because I enjoy them.`,
  `The way you care about feeding me feels more loving than most big romantic gestures.`,
  `You say you “give me space” then ask:\nwhere, with who, why, when, how long, what are you eating, and send updates every 12 seconds.`,
  `When you ask me for help I instantly feel needed in the best way possible.`,
  `Reading Quran together heals something inside me.`,
  `You make me happy in a way that still scares me sometimes.`,
  `Every time I look at you I genuinely say Alhamdulillah because there is no way I deserved this much.`,
  `The way you say “حاضر” melts my entire mood instantly.`,
  `I love how much you use and wear the things I get you.`,
  `Your oversized home shirts are one of my favorite versions of you.`,
  `I genuinely enjoy being your Google search engine.`,
  `Your duas for me stay in my chest for days.`,
  `Waking up and reading your long messages about your day became one of my favorite feelings in life.`,
  `Your notifications change my mood immediately.`,
  `You genuinely have the softest heart I’ve ever known.`,
  `Your family feels warm in the same way you do.`,
  `The way you correct my Quran mistakes.`,
  `Your virtual kisses still affect me somehow.`,
  `Every request you make sounds cute even if I know it will destroy my schedule.`,
  `Helping you pick pictures to post is weirdly one of my favorite things.`,
  `Every picture you post looks like I should be jealous of Instagram itself.`,
  `You’re smart in the most attractive way and innocent in the cutest way.`,
  `Watching you learn without ego is so attractive.`,
  `Your jokes are terrible. Please never stop.`,
  `Your soul is genuinely prettier than your face somehow.`,
  `The way you love babies makes me accidentally imagine futures.`,
  `The way you care about animals.`,
  `You have your own way of doing literally everything.`,
  `Your stalking skills need to be studied professionally.`,
  `The way you defend every unnecessary purchase with a full presentation afterward.`,
  `I love that your happiness matters more to you than pretending to be “too careful” with money.`,
  `Your shyness physically affects my heartbeat sometimes.`,
  `The way you get surprised makes you look five years old.`,
  `Your random “I miss you” texts ruin my concentration instantly.`,
  `Your emojis literally type with your personality.`,
  `I love how fully myself I can be around you.`,
  `The tiny pause before you say “okay” when you’re jealous.`,
  `Your sleepy voice after a long day feels like home.`,
  `The way you ask “did you eat?” like it’s a serious responsibility.`,
  `The way you soften after arguments makes me love you even more.`,
  `The way you immediately show me the moon when it looks pretty.`,
  `You remember tiny details about me that I forgot myself.`,
  `The way your eyes look for my reaction first.`,
  `Your happiness became tied to mine so naturally.`,
  `Your sadness genuinely changes my whole day.`,
  `You made the future feel exciting instead of stressful.`,
  `I can’t imagine a future anymore where you’re not automatically there.`,
  `The way loving you made me understand why poets ruined their lives writing.`,
]

const balloonPalette = ['#e9b8bd', '#f6ecd9', '#f2eadf', '#7a2c3d', '#d6bd8d']

const ruleOfThreeFrames = [
  {
    id: 'past',
    title: 'PAST',
    subtitle: 'The first frame found us.',
    image: '/pics/door3/pic1.jpg',
    alt: 'A memory from the beginning',
  },
  {
    id: 'present',
    title: 'PRESENT',
    subtitle: 'The second frame kept us.',
    image: '/pics/door3/pic2.jpeg',
    alt: 'A present memory of love and recognition',
  },
  {
    id: 'future',
    title: 'FUTURE',
    subtitle: 'The third frame is waiting for us.',
    image: null,
    alt: '',
  },
]

const ruleOfThreePoem = `The world has always hidden its strongest things in threes.

Beginning.
Middle.
End.

Past.
Present.
Future.

A match needs three things before it becomes fire.
A painting survives through three hands:
the one who creates it,
the one who keeps it,
and the one who understands it.

Maybe that is why I keep thinking about that drawing of yours.

Not because of the paper itself.
Not because of the colors.

But because somehow, out of an entire school,
out of hundreds of rooms and hundreds of careless days,
it ended up in mine.

No explanation.

Just your name sitting quietly on my desk
like the universe had signed something before we did.

And maybe that was the first time love touched us—
not dramatically,
not loudly,
just gently enough to be mistaken for coincidence.

I still think about that sometimes.

How many impossible things had to happen
for me to hold a reason to talk to you in my hands.

A misplaced painting.
A shared committee.
A conversation that could have ended normally
but never really ended after that.

And now look at us.

The second frame exists because the first one did.

Two people sitting together,
rings resting quietly between their fingers
like they had always belonged there.

There is something terrifyingly soft about that picture.

Not the rings themselves.
Not the camera.
Not even the smiles.

It is the safety in it.

The kind of safety people spend entire lifetimes searching for.

The kind that makes the world outside the room feel smaller.

I look at that frame
and suddenly every difficult thing in life
feels negotiable.

Because your hand in mine
has slowly taught my heart a dangerous habit:

peace.

And maybe that is what love actually is.

Not fireworks.
Not grand speeches.

Just finding one person
whose presence lowers the volume of the world.

Then there is the third frame.

Empty.
For now.

And somehow that empty frame moves me the most.

Because it is not empty in the way strangers would think.

I already see things inside it.

A home that still does not exist yet.
 Your laughter somewhere in another room.
 Half-finished coffees going cold beside us.
 Paintings on walls we have not chosen yet.
 Arguments about curtains.
 Late nights.
 Slow mornings.
 A thousand ordinary Tuesdays that will quietly become my favorite memories.

I think that is the strangest thing about loving you.

You made me excited for ordinary life.

Not the loud moments.
Not the cinematic moments.

The small ones.

The grocery lists.
 The tired evenings.
 The asking you how your day was for the ten thousandth time.
 The reaching for your hand without thinking.

Because I do not just want one future with you.

I want enough futures
to fill an entire museum.

And if the world truly trusts the things that arrive in threes,
then maybe it was never:
 past, present, future.

maybe it was always:
 I, Love, You.

The first frame found us.
The second frame kept us.
The third frame is waiting for us.

And for the first time in my life,
I am no longer afraid of forever.`

const doorFourPoem = `There are songs older than our parents
that somehow knew you before I did.

That thought genuinely unsettles me sometimes.

Because it means somewhere, decades ago,
a stranger sat alone under dim light,
trying to survive a feeling large enough to rearrange his nervous system,
and without realizing it,
he began writing fragments of you.

Not your face.

Faces are easy.

The world has always had beautiful women.

No—
he wrote the aftermath.

The psychological damage of meeting someone
capable of making reality itself feel altered.

That is rarer.

And maybe that is why these verses followed me for years
before I understood them.

A sentence means nothing
until one human being arrives
and suddenly gives it blood circulation.

Before you, songs were songs.

After you, they became documents.

Evidence left behind by people
who clearly did not survive love quietly either.

I think that is why [1] had to come first.

Because distance is the first thing love humiliates.

Not immediately.

At first distance behaves normally.
Miles remain miles.
Countries remain countries.
Airports remain airports.

Then one person enters your life deeply enough
and suddenly geography starts malfunctioning.

You begin hearing them in silence.

Seeing them in objects.

Missing them with specific body parts.

And somehow a human being starts existing inside you continuously,
regardless of location.

That should not be biologically possible.

Yet every person who has truly loved someone understands it instantly.

The terrifying thing is that I was not empty before you.

I need you to understand that.

My life was not tragic enough to explain this transformation neatly.

I had friends.
Movement.
Noise.
Goals.
Rooms loud enough to drown thought itself.

I genuinely believed fullness and aliveness were synonyms.

Then one evening beside a music room,
you touched my hand casually enough
to ruin that illusion forever.

There should have been orchestras.

Warnings.

Structural failure.

Instead the world continued normally,
which is horrifying in retrospect.

Because it means the biggest events in human life
often arrive dressed as ordinary seconds.

And that is exactly why [3] belongs there.

Not because it is romantic.

Because it captures the collapse of resistance.

The moment intelligence becomes irrelevant.

The moment you realize your heart has already crossed a border
your mind is still pretending to approach carefully.

And once that border disappears,
something even more dangerous begins.

Because eventually love stops asking politely.

Eventually it says: [4]

And suddenly sacrifice stops sounding heroic.

It starts sounding obvious.

People think falling in love feels dramatic.

It does not.

Real love feels terrifyingly natural.

Like discovering your soul had already signed something
before you consciously read the contract.

And after that moment,
everything started reorganizing itself around you quietly.

Not through obsession.

Through gravity.

There is a difference.

Obsession is loud.
Temporary.
Self-consuming.

Gravity is patient.

Gravity simply makes every object in the system begin leaning unconsciously toward one center.

That is what happened to my life.

My mornings lean toward you now.

My work does too.

Even my ambitions changed shape around your existence.

People think ambition is built from ego.

Mine became architectural after you.

Suddenly success stopped looking like achievement
and started looking like warm lighting touching your face correctly in an apartment we have not entered yet.

A kitchen where your voice exists.
A couch where your legs end up across mine during movies.
Your dresses hanging somewhere nearby like physical proof that loneliness finally lost.

That is why [12] matters.

Because we truly were children standing beside consequences too large for us to measure.

People underestimate how terrifying that is.

To realize years later
that your future may have quietly begun
before you even understood the word “future” correctly.

And maybe that is why [14] hurts so much too.

Because the deepest love always feels strangely ancient.

Not old.

Ancient.

As if your soul recognized something before your memory did.

As if every version of you had been slowly walking toward one person unknowingly.

I think that is why your smile unsettles me sometimes.

Not aesthetically.

Existentially.

Because [7] is true in a way that embarrasses me.

There are moments where it genuinely feels like you know me
from somewhere beyond experience.

Like somewhere inside your face
exists information about me
I have not confessed yet.

And once that kind of recognition enters your life,
ordinary attraction becomes impossible to respect again.

Because attraction notices beauty.

Recognition notices being.

That is rarer.

Far rarer.

And perhaps that is what all these songs were trying to describe unsuccessfully.

Not romance.

Recognition.

The terrifying relief of discovering another consciousness
where your soul does not feel translated poorly.

Which explains why silence changed after you.

Before you, silence was absence of sound.

After you, silence became emotional topography.

There is silence after your call ends.
Silence waiting for your notifications.
Silence during long nights where distance suddenly becomes physically measurable inside the chest.

And then there is the worst silence of all:

the silence where beautiful things happen
and your first instinct is reaching for someone who is not there to witness them with you.

That silence created [9].

Because eventually love stops being about desire.

It becomes about sharing existence itself.

Not wanting someone beside you.

Wanting reality to pass through them first.

A song sounds incomplete until they hear it.
A sunset feels undocumented until they see it.
Even your own thoughts start feeling unfinished without their presence touching them somewhere.

That is an insane way for a human being to exist inside another human being.

Yet people have been writing about it for centuries because it keeps happening.

That is why [5] belongs there too.

Not as flattery.

As observation.

Because once someone becomes emotionally integrated into your perception correctly,
life itself changes texture around them.

Food tastes more alive.
Cities become less mechanical.
Time softens.

Even suffering becomes strangely survivable
because somewhere inside the pain exists another person’s voice waiting at the end of it.

That is what nobody explains about love.

Real love does not remove suffering.

It makes suffering feel inhabited.

And God—
your face.

There are moments where I look at you
and understand exactly why [11] had to be written.

Not because you are beautiful.

That sentence is insufficient.

The real problem is that your beauty interrupts thought.

That is different.

Real beauty causes temporary cognitive failure.

The mind stalls for half a second trying to process something emotionally overwhelming.

You smiling unexpectedly.
You getting excited over tiny things.
You asking whether you look okay while reality itself is struggling to answer honestly.

And that question—
“Do I look okay?”—

might genuinely be one of the strangest things you do.

Because there are moments where asking you that feels like asking sunlight whether it is bright enough.

That is why [8] exists.

Not as reassurance.

As confusion.

The confusion of someone trying to explain to another person
that they have become visually inseparable from beauty itself.

And somehow, despite all that,
the deepest part was never visual.

It was behavioral.

The terrifying way you entered routine.

That is where love becomes irreversible.

Not in dramatic moments.

In repetition.

In how your notifications began controlling entire moods.
How exhaustion became easier after hearing your voice.
How even work transformed into an extension of caring for a future version of us.

You became infrastructure.

Part of the operating system itself.

That is why [6] feels devastatingly accurate.

Because loneliness is not always sadness.

Sometimes loneliness is simply the absence of recognition.

And the moment somebody truly recognizes you,
something ancient inside the body unclenches.

Like your soul finally setting down weight
it forgot it had been carrying.

And maybe that is why [13] exists too.

Because eventually love reaches a point
where the universe genuinely appears visually altered around one person.

Light changes.

Time changes.

Even memory changes color afterward.

And perhaps that is why [10] belongs here too.

Because once you meet someone capable of understanding you deeply enough,
crowds begin feeling strangely insufficient.

Noise becomes exhausting.

Performance becomes tiring.

You start wanting to disappear from the world correctly.

Not alone.

With them.

Away from all the unnecessary sound.

Just two people existing honestly enough
to hear each other think.

That kind of intimacy is rarer than love itself.

And perhaps that is the final tragedy of loving someone correctly:

the world before them remains technically visible,
but emotionally,
it never becomes fully inhabitable again.

That is why [2] belongs at the end.

Not as devotion.

As consequence.

Because after a certain point,
loving someone stops becoming a choice you repeatedly make.

It becomes a condition of consciousness itself.

Like breathing.
Like gravity.
Like time.

Something no longer performed.

Only lived inside.`

function getBalloonStyle(index) {
  const lanes = [18, 37, 62, 81, 27, 52, 73]
  const x = lanes[index % lanes.length] + (((index * 7) % 9) - 4)
  const top = 28 + index * 28 + (index % 3) * 6
  const note = balloonNotes[index]
  const important = isImportantBalloonNote(note)
  return {
    '--x': `${Math.max(10, Math.min(90, x))}%`,
    '--top': `${top}vh`,
    '--delay': `${-(index % 9) * 0.55}s`,
    '--size': `${1.1 + (index % 5) * 0.04 + (important ? 0.1 : 0)}`,
    '--note-angle': `${((index * 11) % 10) - 5}deg`,
    '--balloon-color': balloonPalette[index % balloonPalette.length],
    '--paper-width': `${getBalloonNoteWidth(note)}px`,
  }
}

function getBalloonCount(note) {
  if (note.length > 135 || isImportantBalloonNote(note)) return 3
  if (note.length > 74) return 2
  return 1
}

function getBalloonNoteWidth(note) {
  if (note.length > 135 || isImportantBalloonNote(note)) return 390
  if (note.length > 74) return 330
  return 270
}

function isImportantBalloonNote(note) {
  return [
    'light of my life',
    'favorite place',
    'kindest heart',
    'Alhamdulillah',
    'future stop feeling scary',
    'poets ruined their lives',
  ].some((phrase) => note.includes(phrase))
}

const arafahSkyLines = [
  { text: 'فَاذْكُرُونِي أَذْكُرْكُمْ', size: 20 },
  { text: 'وَخَلَقْنَاكُمْ أَزْوَاجًا', size: 20 },
  { text: 'اللهم اجعلنا ممن تحبهم وترضى عنهم', size: 17 },
  { text: 'هُنَّ لِبَاسٌ لَّكُمْ\nوَأَنتُمْ لِبَاسٌ لَّهُنَّ', size: 19 },
  { text: 'وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً', size: 20 },
  { text: 'خيركم خيركم لأهله', size: 18 },
  { text: 'الأرواح جنود مجندة', size: 18 },
  { text: 'اللهم اجعل بيننا مودة\nورحمة لا تنقطع', size: 17 },
  { text: 'سَلَامٌ قَوْلًا مِن رَّبٍّ رَّحِيمٍ', size: 19 },
  { text: 'اللهم اجعل حبنا عونًا على طاعتك', size: 17 },
  { text: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا\nوَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', size: 18 },
  { text: 'اللهم اجمعنا في خير وعلى خير وإلى خير', size: 17 },
  { text: 'وَأَلَّفَ بَيْنَ قُلُوبِهِمْ', size: 20 },
  { text: 'اللهم بارك لنا في عمرنا وحبنا وأيامنا', size: 17 },
  { text: 'واجعلنا للمتقين إمامًا', size: 18 },
  { text: 'ادْخُلُوهَا بِسَلَامٍ آمِنِينَ', size: 19 },
  { text: 'اللهم ارزقنا ذرية صالحة تقرّ بها أعيننا', size: 17 },
  { text: 'اللهم اجعل بيتنا سكنًا ورحمةً ونورًا', size: 17 },
  { text: 'اللهم لا تجعل في قلوبنا إلا ما يرضيك', size: 17 },
  { text: 'اللهم اجعلنا خيرًا لبعضنا', size: 19 },
  { text: 'وَإِلَىٰ رَبِّكَ فَارْغَب', size: 20 },
  { text: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم\nمِّنْ أَنفُسِكُمْ أَزْوَاجًا', size: 17 },
  { text: 'اللهم اجعلنا لباسًا وسكنًا وأمانًا لبعضنا', size: 17 },
]

const adventureMemoryPages = Array.from({ length: 25 }, (_, index) => index + 1)
  .filter((pageNumber) => pageNumber !== 13)
  .map((pageNumber) => ({ type: 'image', src: `/pics/door6/${pageNumber}.png`, pageNumber }))

const adventureBookPages = [
  ...adventureMemoryPages,
  { type: 'blank', id: 'quiet-page-one' },
  { type: 'blank', id: 'quiet-page-two' },
  { type: 'final', id: 'you-are-my-adventure' },
]

function ArafahRoomScene() {
  const canvasRef = useRef(null)
  const scrollAreaRef = useRef(null)
  const scrollTrackRef = useRef(null)
  const skyLayerRef = useRef(null)
  const promptRef = useRef(null)
  const finalRef = useRef(null)
  const cursorRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const scrollArea = scrollAreaRef.current
    const scrollTrack = scrollTrackRef.current
    const skyLayer = skyLayerRef.current
    const prompt = promptRef.current
    const final = finalRef.current
    const cursor = cursorRef.current
    if (!canvas || !scrollArea || !scrollTrack || !skyLayer || !prompt || !final || !cursor) return undefined

    const ctx = canvas.getContext('2d')
    let width = 0
    let height = 0
    let time = 0
    let scrollProgress = 0
    let mouseX = 0.5
    let mouseY = 0.5
    let targetMouseX = 0.5
    let targetMouseY = 0.5
    let rawMouseX = 0
    let rawMouseY = 0
    let frameId = 0
    let revealTimeout = 0
    let disposed = false
    const particles = []
    const placedBoxes = []
    const lineEls = []
    const ease = (value) => (value < 0.5 ? 2 * value * value : -1 + (4 - 2 * value) * value)
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
    const lerp = (a, b, amount) => a + (b - a) * amount
    const colorStep = (value) => Math.round(value)

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      placeLines()
    }

    const overlaps = (x, y, w, h) => placedBoxes.some((box) => {
      const dx = Math.abs((x + w / 2) - (box.x + box.w / 2))
      const dy = Math.abs((y + h / 2) - (box.y + box.h / 2))
      return dx < (w + box.w) / 2 + 20 && dy < (h + box.h) / 2 + 20
    })

    const placeLines = () => {
      placedBoxes.length = 0
      const skyHeight = height * 0.5
      const padX = width * 0.05
      lineEls.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const elWidth = Math.max(rect.width, 10)
        const elHeight = Math.max(rect.height, 14)
        let x = padX
        let y = 24
        for (let attempt = 0; attempt < 260; attempt += 1) {
          x = padX + Math.random() * Math.max(1, width - padX * 2 - elWidth)
          y = 20 + Math.random() * Math.max(1, skyHeight - elHeight - 28)
          if (!overlaps(x, y, elWidth, elHeight)) break
        }
        el.dataset.baseLeft = String(x)
        el.dataset.baseTop = String(y)
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        el.classList.add('placed')
        placedBoxes.push({ x, y, w: elWidth, h: elHeight })
      })
    }

    const spawnParticle = (x, y, burst = false) => {
      const count = burst ? 12 : 1
      for (let i = 0; i < count; i += 1) {
        const angle = burst ? (Math.PI * 2 / count) * i + Math.random() * 0.3 : -Math.PI / 2
        const speed = burst ? 1.5 + Math.random() * 2.5 : Math.random() * 0.8 + 0.2
        particles.push({
          x,
          y,
          vx: burst ? Math.cos(angle) * speed : (Math.random() - 0.5) * 0.5,
          vy: burst ? Math.sin(angle) * speed : -speed,
          radius: Math.random() * 1.8 + 0.5,
          life: 1,
          decay: 0.02 + Math.random() * 0.02,
          burst,
        })
      }
    }

    const revealLines = () => {
      const order = [...lineEls.keys()].sort(() => Math.random() - 0.5)
      let index = 0
      const revealNext = () => {
        const el = lineEls[order[index]]
        if (!el) {
          prompt.classList.add('visible')
          return
        }
        el.style.opacity = el.dataset.baseOpacity || '0.78'
        el.classList.add('shown')
        const rect = el.getBoundingClientRect()
        for (let i = 0; i < 5; i += 1) {
          spawnParticle(rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width, rect.top + rect.height / 2, true)
        }
        index += 1
        revealTimeout = window.setTimeout(revealNext, 4000)
      }
      revealTimeout = window.setTimeout(revealNext, 1600)
    }

    const updateScroll = () => {
      const max = scrollTrack.offsetHeight - height
      scrollProgress = max > 0 ? Math.min(scrollArea.scrollTop / max, 1) : 0
      const skyOpacity = 1 - clamp((scrollProgress - 0.06) / 0.28, 0, 1)
      lineEls.forEach((el) => {
        if (el.classList.contains('shown')) {
          el.style.opacity = String(Number(el.dataset.baseOpacity || 0.78) * skyOpacity)
        }
      })
      if (prompt.classList.contains('visible')) {
        prompt.style.opacity = String(Math.max(0, 1 - clamp((scrollProgress - 0.04) / 0.14, 0, 1)))
      }
      const finalOpacity = clamp((scrollProgress - 0.88) / 0.08, 0, 1)
      final.style.opacity = String(finalOpacity)
      final.classList.toggle('visible', finalOpacity > 0.04)
    }

    const drawFigures = (horizon, skyPower) => {
      const groundY = horizon + 2
      const scale = lerp(1, 0.72, scrollProgress)
      const figureHeight = height * 0.082 * scale
      const centerX = width * 0.498
      const gap = figureHeight * 0.52
      const sway = Math.sin(time * 0.38) * 1.4
      const alpha = lerp(0.76, 0.92, skyPower)
      const drawPerson = (x, tall, feminine) => {
        const figureWidth = tall * (feminine ? 0.28 : 0.32)
        ctx.save()
        ctx.translate(x + sway * (feminine ? 0.25 : 0.2), groundY)
        ctx.beginPath()
        ctx.moveTo(-figureWidth * 0.58, 0)
        ctx.bezierCurveTo(-figureWidth * 0.88, -tall * 0.36, -figureWidth * 0.72, -tall * 0.76, -figureWidth * 0.16, -tall * 0.88)
        ctx.bezierCurveTo(-figureWidth * 0.05, -tall * 0.94, figureWidth * 0.05, -tall * 0.94, figureWidth * 0.16, -tall * 0.88)
        ctx.bezierCurveTo(figureWidth * 0.72, -tall * 0.76, figureWidth * 0.88, -tall * 0.36, figureWidth * 0.58, 0)
        ctx.closePath()
        ctx.fillStyle = `rgba(234,224,206,${alpha})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(0, -tall * 0.92, figureWidth * 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      drawPerson(centerX - gap, figureHeight * 0.9, true)
      drawPerson(centerX + gap, figureHeight, false)
      if (scrollProgress > 0.12) {
        const progress = clamp((scrollProgress - 0.12) / 0.22, 0, 1)
        const handY = groundY - figureHeight * 0.22
        const x1 = centerX - gap + figureHeight * 0.13
        const x2 = centerX + gap - figureHeight * 0.14
        ctx.beginPath()
        ctx.moveTo(x1, handY)
        ctx.lineTo(lerp(x1, x2, progress), handY)
        ctx.strokeStyle = `rgba(222,208,180,${progress * 0.65 * alpha})`
        ctx.lineWidth = figureHeight * 0.045
        ctx.lineCap = 'round'
        ctx.stroke()
        if (progress > 0.82) {
          const heartAlpha = clamp((progress - 0.82) / 0.18, 0, 1) * alpha
          const pulse = 1 + 0.16 * Math.pow(Math.max(0, Math.sin(time * Math.PI * 1.1)), 2)
          const radius = figureHeight * 0.26 * pulse
          ctx.save()
          ctx.translate(centerX, handY - figureHeight * 0.38)
          ctx.beginPath()
          ctx.moveTo(0, radius * 0.65)
          ctx.bezierCurveTo(-radius * 1.25, -radius * 0.05, -radius * 1.25, -radius * 0.95, 0, -radius * 0.38)
          ctx.bezierCurveTo(radius * 1.25, -radius * 0.95, radius * 1.25, -radius * 0.05, 0, radius * 0.65)
          ctx.strokeStyle = `rgba(218,185,112,${heartAlpha})`
          ctx.fillStyle = `rgba(230,192,118,${heartAlpha * 0.22})`
          ctx.lineWidth = Math.max(1.2, radius * 0.09)
          ctx.stroke()
          ctx.fill()
          ctx.restore()
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const skyProgress = ease(clamp(scrollProgress * 1.35, 0, 1))
      const breath = Math.sin(time * 0.07) * 0.012 + Math.sin(time * 0.031) * 0.008
      const skyPower = clamp(skyProgress + breath, 0, 1)
      const horizon = height * 0.525 + (mouseY - 0.5) * height * 0.018
      const gradient = ctx.createLinearGradient(0, 0, 0, horizon)
      gradient.addColorStop(0, `rgb(${colorStep(lerp(5, 26, skyPower))},${colorStep(lerp(3, 14, skyPower))},${colorStep(lerp(9, 22, skyPower))})`)
      gradient.addColorStop(0.45, `rgb(${colorStep(lerp(11, 78, skyPower))},${colorStep(lerp(7, 44, skyPower))},${colorStep(lerp(15, 38, skyPower))})`)
      gradient.addColorStop(1, `rgb(${colorStep(lerp(28, 205, skyPower))},${colorStep(lerp(16, 108, skyPower))},${colorStep(lerp(22, 52, skyPower))})`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, horizon + 1)

      const halo = ctx.createRadialGradient(width / 2, horizon, 0, width / 2, horizon, width * 0.8)
      halo.addColorStop(0, `rgba(255,192,85,${clamp((skyPower - 0.06) / 0.5, 0, 1) * 0.12})`)
      halo.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, width, horizon)

      const ground = ctx.createLinearGradient(0, horizon, 0, height)
      ground.addColorStop(0, `rgb(${colorStep(lerp(9, 55, skyPower))},${colorStep(lerp(6, 42, skyPower))},${colorStep(lerp(6, 32, skyPower))})`)
      ground.addColorStop(1, `rgb(${colorStep(lerp(5, 24, skyPower))},${colorStep(lerp(3, 17, skyPower))},${colorStep(lerp(3, 13, skyPower))})`)
      ctx.fillStyle = ground
      ctx.fillRect(0, horizon, width, height - horizon)

      const centerX = width * 0.505 + (mouseX - 0.5) * width * 0.012
      const peakHeight = lerp(height * 0.13, height * 0.3, scrollProgress)
      const peakY = horizon - peakHeight
      const mountainWidth = width * lerp(0.28, 0.44, scrollProgress)
      ctx.beginPath()
      ctx.moveTo(centerX - mountainWidth, horizon + 1)
      ctx.bezierCurveTo(centerX - mountainWidth * 0.75, horizon - peakHeight * 0.28, centerX - mountainWidth * 0.22, peakY + peakHeight * 0.08, centerX + mountainWidth * 0.04, peakY)
      ctx.bezierCurveTo(centerX + mountainWidth * 0.28, peakY + peakHeight * 0.07, centerX + mountainWidth * 0.78, horizon - peakHeight * 0.25, centerX + mountainWidth, horizon + 1)
      ctx.closePath()
      ctx.fillStyle = `rgba(${colorStep(lerp(18, 78, skyPower))},${colorStep(lerp(14, 56, skyPower))},${colorStep(lerp(12, 44, skyPower))},0.95)`
      ctx.fill()

      drawFigures(horizon, skyPower)

      if (rawMouseX > 0 && time % 0.08 < 0.018) spawnParticle(rawMouseX, rawMouseY)
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i]
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.04
        particle.life -= particle.decay
        if (particle.life <= 0) {
          particles.splice(i, 1)
        } else {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.radius * particle.life, 0, Math.PI * 2)
          ctx.fillStyle = particle.burst ? `rgba(255,215,140,${particle.life * 0.7})` : `rgba(235,210,155,${particle.life * 0.35})`
          ctx.fill()
        }
      }

      const vignette = ctx.createRadialGradient(width / 2, height * 0.47, height * 0.16, width / 2, height * 0.47, height * 0.88)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, `rgba(0,0,0,${lerp(0.82, 0.6, skyPower)})`)
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)
    }

    const animate = (timestamp) => {
      time = timestamp / 1000
      mouseX = lerp(mouseX, targetMouseX, 0.05)
      mouseY = lerp(mouseY, targetMouseY, 0.05)
      lineEls.forEach((el) => {
        if (!el.classList.contains('shown')) return
        const baseLeft = Number(el.dataset.baseLeft || 0)
        const baseTop = Number(el.dataset.baseTop || 0)
        const depth = Number(el.dataset.depth || 0.012)
        el.style.left = `${baseLeft + (mouseX - 0.5) * width * depth}px`
        el.style.top = `${baseTop + (mouseY - 0.5) * height * depth * 0.6}px`
      })
      draw()
      frameId = requestAnimationFrame(animate)
    }

    const handleMouseMove = (event) => {
      rawMouseX = event.clientX
      rawMouseY = event.clientY
      targetMouseX = event.clientX / width
      targetMouseY = event.clientY / height
      cursor.style.left = `${event.clientX}px`
      cursor.style.top = `${event.clientY}px`
    }

    const handleClick = (event) => {
      const ripple = document.createElement('span')
      ripple.className = 'arafah-ripple'
      ripple.style.left = `${event.clientX}px`
      ripple.style.top = `${event.clientY}px`
      skyLayer.appendChild(ripple)
      window.setTimeout(() => ripple.remove(), 1500)
      spawnParticle(event.clientX, event.clientY, true)
    }

    arafahSkyLines.forEach((line, index) => {
      const el = document.createElement('span')
      el.className = 'arafah-sky-line'
      el.textContent = line.text
      el.style.fontSize = `${line.size}px`
      el.dataset.baseOpacity = String(0.72 + (index % 5) * 0.03)
      el.dataset.depth = String(0.008 + (index % 7) * 0.003)
      skyLayer.appendChild(el)
      lineEls.push(el)
    })

    resize()
    const fontsReady = document.fonts?.ready || Promise.resolve()
    fontsReady.then(() => {
      if (disposed) return
      placeLines()
      revealLines()
    })
    updateScroll()
    frameId = requestAnimationFrame(animate)
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    scrollArea.addEventListener('scroll', updateScroll)

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      clearTimeout(revealTimeout)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      scrollArea.removeEventListener('scroll', updateScroll)
      skyLayer.replaceChildren()
    }
  }, [])

  return (
    <div className="arafah-scene">
      <div ref={cursorRef} className="arafah-cursor" aria-hidden="true" />
      <canvas ref={canvasRef} className="arafah-canvas" aria-hidden="true" />
      <div ref={scrollAreaRef} className="arafah-scroll-area">
        <div ref={scrollTrackRef} className="arafah-scroll-track" />
      </div>
      <div ref={skyLayerRef} className="arafah-sky-layer" aria-hidden="true" />
      <div ref={promptRef} className="arafah-scroll-prompt">
        <span className="arafah-prompt-text">Take my hand and come with me</span>
        <span className="arafah-scroll-label">scroll down</span>
        <span className="arafah-scroll-arrow" />
      </div>
      <div ref={finalRef} className="arafah-final-msg">
        <p>Till the day we are on Arafah together...</p>
        <p className="sub">Door V - Arafah</p>
      </div>
      <div className="arafah-door-label">Door V - Arafah</div>
    </div>
  )
}

function AdventureBookRoom() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCoverAway, setIsCoverAway] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pendingPageIndex, setPendingPageIndex] = useState(null)
  const [flipDirection, setFlipDirection] = useState('next')
  const [isFlipping, setIsFlipping] = useState(false)
  const [missingPages, setMissingPages] = useState({})
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const touchStartXRef = useRef(null)
  const flipTimeoutRef = useRef(null)
  const coverTimeoutRef = useRef(null)
  const paperAudioContextRef = useRef(null)
  const visiblePageIndex = pendingPageIndex ?? pageIndex
  const leftPageIndex = pendingPageIndex == null
    ? pageIndex - 1
    : flipDirection === 'next'
      ? pageIndex
      : pendingPageIndex - 1
  const flipPageIndex = flipDirection === 'prev' && pendingPageIndex != null ? pendingPageIndex : pageIndex
  const ageProgress = pageIndex / (adventureBookPages.length - 1)

  useEffect(() => {
    return () => {
      clearTimeout(flipTimeoutRef.current)
      clearTimeout(coverTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const indexesToPreload = Array.from({ length: 13 }, (_, index) => pageIndex - 6 + index)
      .filter((index) => index >= 0 && index < adventureBookPages.length)
    indexesToPreload.forEach((index) => {
      if (adventureBookPages[index]?.type !== 'image') return
      const img = new Image()
      img.src = adventureBookPages[index].src
    })
  }, [pageIndex])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') turnPage(pageIndex + 1)
      if (event.key === 'ArrowLeft') turnPage(pageIndex - 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isFlipping, pageIndex])

  useEffect(() => {
    if (!isOpen) return undefined
    const preloadAll = () => {
      adventureBookPages.forEach((page) => {
        if (page.type !== 'image') return
        const img = new Image()
        img.src = page.src
      })
    }
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadAll, { timeout: 1800 })
      return () => window.cancelIdleCallback(idleId)
    }
    const id = setTimeout(preloadAll, 600)
    return () => clearTimeout(id)
  }, [isOpen])

  const playPaperRustle = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const context = paperAudioContextRef.current || new AudioContextClass()
    paperAudioContextRef.current = context
    if (context.state === 'suspended') context.resume().catch(() => {})

    const duration = 0.46
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) {
      const progress = i / data.length
      const envelope = Math.sin(progress * Math.PI) * (1 - progress * 0.24)
      data[i] = (Math.random() * 2 - 1) * envelope * 0.18
    }
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    filter.type = 'bandpass'
    filter.frequency.value = 1450
    filter.Q.value = 0.72
    gain.gain.value = 0.035
    source.buffer = buffer
    source.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)
    source.start()
  }

  const turnPage = (nextIndex) => {
    if (isFlipping || !isOpen) return
    if (nextIndex < 0 || nextIndex >= adventureBookPages.length || nextIndex === pageIndex) return
    playPaperRustle()
    clearTimeout(flipTimeoutRef.current)
    setFlipDirection(nextIndex > pageIndex ? 'next' : 'prev')
    setPendingPageIndex(nextIndex)
    setIsFlipping(true)
    flipTimeoutRef.current = setTimeout(() => {
      setPageIndex(nextIndex)
      setPendingPageIndex(null)
      setIsFlipping(false)
    }, 1320)
  }

  const openBook = () => {
    if (isOpen) return
    playPaperRustle()
    clearTimeout(coverTimeoutRef.current)
    setIsCoverAway(false)
    setIsOpen(true)
    coverTimeoutRef.current = setTimeout(() => setIsCoverAway(true), 1380)
  }

  const markPageMissing = (index) => {
    setMissingPages((current) => ({ ...current, [index]: true }))
  }

  const renderMemoryImage = (index, decorative = false) => (
    adventureBookPages[index]?.type === 'blank' ? (
      <div className="adventure-empty-page" aria-hidden={decorative ? 'true' : undefined} />
    ) : adventureBookPages[index]?.type === 'final' ? (
      <div className="adventure-final-page" aria-hidden={decorative ? 'true' : undefined}>
        <span>you are my adventure.</span>
      </div>
    ) : missingPages[index] ? (
      <div className="adventure-missing-page" aria-hidden={decorative ? 'true' : undefined}>
        <span>memory page missing</span>
        <small>{adventureBookPages[index]?.src}</small>
      </div>
    ) : (
      <img
        src={adventureBookPages[index]?.src}
        alt={decorative ? '' : `Adventure Book memory ${index + 1}`}
        draggable="false"
        loading={index <= 2 ? 'eager' : 'lazy'}
        onError={() => markPageMissing(index)}
      />
    )
  )

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    const startX = touchStartXRef.current
    if (startX == null) return
    const endX = event.changedTouches[0]?.clientX ?? startX
    const delta = endX - startX
    touchStartXRef.current = null
    if (Math.abs(delta) < 36) return
    turnPage(delta < 0 ? pageIndex + 1 : pageIndex - 1)
  }

  return (
    <div
      className={`adventure-room-scene ${isOpen ? 'book-open' : 'book-closed'} ${isCoverAway ? 'cover-away' : ''} ${isFlipping ? `is-flipping flip-${flipDirection}` : ''}`}
      style={{ '--book-age': ageProgress, '--door6-vw': `${viewport.width}px`, '--door6-vh': `${viewport.height}px` }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="adventure-room-lamp" aria-hidden="true" />
      <div className="adventure-room-dust" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <span key={index} style={{ '--i': index, '--x': `${(index * 37) % 100}%`, '--y': `${(index * 61) % 100}%` }} />
        ))}
      </div>
      <div className="adventure-up-atmosphere" aria-hidden="true">
        <span className="adventure-wall-map adventure-wall-map-one" />
        <span className="adventure-wall-map adventure-wall-map-two" />
        <span className="adventure-postcard adventure-postcard-one" />
        <span className="adventure-postcard adventure-postcard-two" />
        <span className="adventure-ticket-fragment adventure-ticket-fragment-one">ADMIT ONE</span>
        <span className="adventure-ticket-fragment adventure-ticket-fragment-two">PARADISE FALLS</span>
        {Array.from({ length: 7 }, (_, index) => (
          <span key={`scrap-${index}`} className="adventure-paper-scrap" style={{ '--i': index }} />
        ))}
        <span className="adventure-map-line adventure-map-line-one" />
        <span className="adventure-map-line adventure-map-line-two" />
        <span className="adventure-compass-doodle" />
        <span className="adventure-travel-stamp adventure-travel-stamp-one">PARADISE</span>
        <span className="adventure-travel-stamp adventure-travel-stamp-two">ADVENTURE</span>
        <span className="adventure-note-card adventure-note-card-one">places to go</span>
        <span className="adventure-note-card adventure-note-card-two">things to keep</span>
        <span className="adventure-soft-balloon-cluster adventure-soft-balloon-cluster-one" />
        <span className="adventure-soft-balloon-cluster adventure-soft-balloon-cluster-two" />
        <span className="adventure-soft-balloon-cluster adventure-soft-balloon-cluster-horizon" />
        {adventureBookPages[visiblePageIndex]?.type === 'final' && (
          <span className="adventure-soft-balloon-cluster adventure-soft-balloon-cluster-final" />
        )}
      </div>

      <div className="adventure-book-stage">
        <div className="adventure-book-shadow" aria-hidden="true" />
        <div className="adventure-book">
          <button
            type="button"
            className="adventure-book-cover"
            onClick={openBook}
            aria-label="Open Our Adventure Book"
            disabled={isOpen}
          >
            <span className="adventure-book-spine" aria-hidden="true" />
            <span className="adventure-stitch-holes" aria-hidden="true" />
            <span className="adventure-binding-strings" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="adventure-cover-corners" aria-hidden="true" />
            <span className="adventure-cover-title">OUR ADVENTURE BOOK</span>
            <span className="adventure-cover-subtitle">100 years of us</span>
            <span className="adventure-cover-wear adventure-cover-wear-one" aria-hidden="true" />
            <span className="adventure-cover-wear adventure-cover-wear-two" aria-hidden="true" />
          </button>

          <div className="adventure-page-stack" aria-live="polite">
            <div className="adventure-page-backdrop" aria-hidden="true" />
            <article className="adventure-page adventure-page-left" aria-hidden="true">
              <span className="adventure-page-edge adventure-page-edge-left" />
              <span className="adventure-page-edge adventure-page-edge-right" />
              <span className="adventure-left-stain adventure-left-stain-one" />
              <span className="adventure-left-stain adventure-left-stain-two" />
              {leftPageIndex >= 0 ? (
                <div className="adventure-backside-memory">
                  {renderMemoryImage(leftPageIndex, true)}
                </div>
              ) : (
                <div className="adventure-blank-left-page">
                  <span />
                  <small>the beginning</small>
                </div>
              )}
            </article>

            <article className={`adventure-page adventure-page-current adventure-page-right page-mood-${Math.floor(ageProgress * 4)}`}>
              <span className="adventure-page-edge adventure-page-edge-left" aria-hidden="true" />
              <span className="adventure-page-edge adventure-page-edge-right" aria-hidden="true" />
              <span className="adventure-tape adventure-tape-one" aria-hidden="true" />
              <span className="adventure-tape adventure-tape-two" aria-hidden="true" />
              <span className="adventure-pencil-mark adventure-pencil-mark-one" aria-hidden="true" />
              <span className="adventure-pencil-mark adventure-pencil-mark-two" aria-hidden="true" />
              <button
                type="button"
                className="adventure-page-hit-area"
                onClick={() => turnPage(pageIndex + 1)}
                aria-label="Turn to next memory page"
                disabled={pageIndex === adventureBookPages.length - 1 || isFlipping}
              >
                {renderMemoryImage(visiblePageIndex)}
              </button>
              <span className="adventure-page-number">{String(visiblePageIndex + 1).padStart(2, '0')}</span>
            </article>

            {isFlipping && (
              <article className={`adventure-page adventure-page-flip adventure-page-flip-${flipDirection}`} aria-hidden="true">
                <span className="adventure-page-curl" />
                <span className="adventure-tape adventure-tape-one" />
                <span className="adventure-tape adventure-tape-two" />
                {renderMemoryImage(flipPageIndex, true)}
              </article>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="adventure-page-arrow adventure-page-arrow-prev"
        onClick={() => turnPage(pageIndex - 1)}
        disabled={!isOpen || pageIndex === 0 || isFlipping}
        aria-label="Previous Adventure Book page"
      >
        ‹
      </button>
      <button
        type="button"
        className="adventure-page-arrow adventure-page-arrow-next"
        onClick={() => turnPage(pageIndex + 1)}
        disabled={!isOpen || pageIndex === adventureBookPages.length - 1 || isFlipping}
        aria-label="Next Adventure Book page"
      >
        ›
      </button>

      <div className={`adventure-book-controls ${isOpen ? 'visible' : ''}`} aria-label="Adventure Book page controls">
        <button type="button" onClick={() => turnPage(pageIndex - 1)} disabled={!isOpen || pageIndex === 0 || isFlipping}>
          previous
        </button>
        <span>{String(pageIndex + 1).padStart(2, '0')} / {adventureBookPages.length}</span>
        <button type="button" onClick={() => turnPage(pageIndex + 1)} disabled={!isOpen || pageIndex === adventureBookPages.length - 1 || isFlipping}>
          next
        </button>
      </div>

    </div>
  )
}

function MuseumOfLovingMaram({ embedded, onClose, theme }) {
  const [activeRoom, setActiveRoom] = useState(null)
  const [countdown, setCountdown] = useState(() => getMuseumCountdown())
  const [isMuted, setIsMuted] = useState(() => window.localStorage.getItem('museum-muted') === 'true')
  const [roomProgress, setRoomProgress] = useState(0)
  const [selectedBalloonNote, setSelectedBalloonNote] = useState(null)
  const [activePoemReference, setActivePoemReference] = useState(null)
  const [hasSeenDoorFourEnding, setHasSeenDoorFourEnding] = useState(false)
  const [doorFourSymbolHeight, setDoorFourSymbolHeight] = useState(3600)
  const hallAudioRef = useRef(null)
  const roomAudioRef = useRef(null)
  const roomTwoAudioRef = useRef(null)
  const roomThreeAudioRef = useRef(null)
  const roomFourAudioRef = useRef(null)
  const roomFiveAudioRef = useRef(null)
  const roomSixAudioRef = useRef(null)
  const poemReferenceAudioRefs = useRef({})
  const audioFadeRef = useRef({})
  const poemAudioFadeRef = useRef({})
  const roomRef = useRef(null)
  const doorFourEndingRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setCountdown(getMuseumCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const hallAudio = new Audio('/audio/song1.mp3')
    const roomAudio = new Audio('/audio/door1.mp3')
    const roomTwoAudio = new Audio('/audio/door2.mp3')
    const roomThreeAudio = new Audio('/audio/door3.mp3')
    const roomFourAudio = new Audio('/audio/door4/door4.mp3')
    const roomFiveAudio = new Audio('/audio/door5.mp3')
    const roomSixAudio = new Audio('/audio/door6.mp3')
    ;[hallAudio, roomAudio, roomTwoAudio, roomThreeAudio, roomFourAudio, roomFiveAudio, roomSixAudio].forEach((audio) => {
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = 0
      audio.load()
    })
    hallAudioRef.current = hallAudio
    roomAudioRef.current = roomAudio
    roomTwoAudioRef.current = roomTwoAudio
    roomThreeAudioRef.current = roomThreeAudio
    roomFourAudioRef.current = roomFourAudio
    roomFiveAudioRef.current = roomFiveAudio
    roomSixAudioRef.current = roomSixAudio

    return () => {
      Object.values(audioFadeRef.current).forEach(cancelAnimationFrame)
      Object.values(poemAudioFadeRef.current).forEach(cancelAnimationFrame)
      ;[hallAudio, roomAudio, roomTwoAudio, roomThreeAudio, roomFourAudio, roomFiveAudio, roomSixAudio].forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      Object.values(poemReferenceAudioRefs.current).forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      hallAudioRef.current = null
      roomAudioRef.current = null
      roomTwoAudioRef.current = null
      roomThreeAudioRef.current = null
      roomFourAudioRef.current = null
      roomFiveAudioRef.current = null
      roomSixAudioRef.current = null
      poemReferenceAudioRefs.current = {}
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('museum-muted', String(isMuted))
  }, [isMuted])

  useEffect(() => {
    const hallAudio = hallAudioRef.current
    const roomAudio = roomAudioRef.current
    const roomTwoAudio = roomTwoAudioRef.current
    const roomThreeAudio = roomThreeAudioRef.current
    const roomFourAudio = roomFourAudioRef.current
    const roomFiveAudio = roomFiveAudioRef.current
    const roomSixAudio = roomSixAudioRef.current
    if (!hallAudio || !roomAudio || !roomTwoAudio || !roomThreeAudio || !roomFourAudio || !roomFiveAudio || !roomSixAudio) return undefined

    const fadeAudio = (audio, targetVolume, duration = 1800, pauseAtEnd = false) => {
      if (audioFadeRef.current[audio.src]) cancelAnimationFrame(audioFadeRef.current[audio.src])
      const startVolume = audio.volume
      const startedAt = performance.now()
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration)
        audio.volume = startVolume + (targetVolume - startVolume) * progress
        if (progress < 1) {
          audioFadeRef.current[audio.src] = requestAnimationFrame(tick)
        } else if (pauseAtEnd) {
          audio.pause()
        }
      }
      audioFadeRef.current[audio.src] = requestAnimationFrame(tick)
    }

    const activeAudio = activeRoom === 'before-you'
      ? roomAudio
      : activeRoom === 'balloon-notes'
        ? roomTwoAudio
        : activeRoom === 'rule-of-three'
          ? roomThreeAudio
          : activeRoom === 'poem-answers'
            ? roomFourAudio
            : activeRoom === 'arafah'
              ? roomFiveAudio
              : activeRoom === 'adventure-book'
                ? roomSixAudio
                : hallAudio
    const inactiveAudios = [hallAudio, roomAudio, roomTwoAudio, roomThreeAudio, roomFourAudio, roomFiveAudio, roomSixAudio].filter((audio) => audio !== activeAudio)
    const activeVolume = isMuted
      ? 0
      : activeRoom === 'before-you'
        ? 0.24
        : activeRoom === 'balloon-notes'
          ? 0.23
          : activeRoom === 'rule-of-three'
            ? 0.24
            : activeRoom === 'poem-answers'
              ? 0.12
              : activeRoom === 'arafah'
                ? 0.28
                : activeRoom === 'adventure-book'
                  ? 0.08
                  : 0.22

    const syncAudio = () => {
      if (!isMuted) {
        activeAudio.play().catch(() => {})
      }
      fadeAudio(activeAudio, activeVolume, 3200)
      inactiveAudios.forEach((audio) => fadeAudio(audio, 0, 1600, true))
    }

    syncAudio()
    window.addEventListener('pointerdown', syncAudio, { once: true })
    window.addEventListener('keydown', syncAudio, { once: true })

    return () => {
      window.removeEventListener('pointerdown', syncAudio)
      window.removeEventListener('keydown', syncAudio)
    }
  }, [activeRoom, isMuted])

  useEffect(() => {
    if (activeRoom !== 'poem-answers') {
      stopAllPoemReferenceAudio()
    }
  }, [activeRoom])

  useEffect(() => {
    if (activeRoom !== 'poem-answers') return undefined
    const ending = doorFourEndingRef.current
    if (!ending) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasSeenDoorFourEnding(true)
      },
      { threshold: 0.45 }
    )
    observer.observe(ending)
    return () => observer.disconnect()
  }, [activeRoom])

  useEffect(() => {
    if (activeRoom !== 'poem-answers') return undefined
    const updateSymbolHeight = () => {
      const room = roomRef.current
      if (!room) return
      setDoorFourSymbolHeight(Math.max(room.scrollHeight, room.clientHeight))
    }
    updateSymbolHeight()
    const id = setTimeout(updateSymbolHeight, 80)
    window.addEventListener('resize', updateSymbolHeight)
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', updateSymbolHeight)
    }
  }, [activeRoom])

  useEffect(() => {
    const activeAudio = activePoemReference ? poemReferenceAudioRefs.current[activePoemReference] : null
    if (activeAudio) {
      fadePoemReferenceAudio(activeAudio, isMuted ? 0 : 0.82, 500)
    }
  }, [activePoemReference, isMuted])

  const updateRoomProgress = () => {
    const room = roomRef.current
    if (!room) return
    const maxScroll = Math.max(1, room.scrollHeight - room.clientHeight)
    setRoomProgress(Math.min(1, room.scrollTop / maxScroll))
  }

  const getRoomAudio = (roomId) => {
    if (roomId === 'before-you') return roomAudioRef.current
    if (roomId === 'balloon-notes') return roomTwoAudioRef.current
    if (roomId === 'rule-of-three') return roomThreeAudioRef.current
    if (roomId === 'poem-answers') return roomFourAudioRef.current
    if (roomId === 'arafah') return roomFiveAudioRef.current
    if (roomId === 'adventure-book') return roomSixAudioRef.current
    return hallAudioRef.current
  }

  const warmRoomAudio = (roomId) => {
    const audio = getRoomAudio(roomId)
    if (!audio) return
    audio.preload = 'auto'
    if (audio.readyState < 2) audio.load()
    if (isMuted) return

    audio.volume = 0
    audio.play().catch(() => {})
  }

  const fadePoemReferenceAudio = (audio, targetVolume, duration = 900, resetAtEnd = false) => {
    if (poemAudioFadeRef.current[audio.src]) cancelAnimationFrame(poemAudioFadeRef.current[audio.src])
    const startVolume = audio.volume
    const startedAt = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      audio.volume = startVolume + (targetVolume - startVolume) * progress
      if (progress < 1) {
        poemAudioFadeRef.current[audio.src] = requestAnimationFrame(tick)
      } else if (resetAtEnd) {
        audio.pause()
        audio.currentTime = 0
      }
    }
    poemAudioFadeRef.current[audio.src] = requestAnimationFrame(tick)
  }

  const stopAllPoemReferenceAudio = (exceptReference = null) => {
    Object.entries(poemReferenceAudioRefs.current).forEach(([reference, audio]) => {
      if (Number(reference) === exceptReference) return
      fadePoemReferenceAudio(audio, 0, 650, true)
    })
    if (exceptReference == null) {
      setActivePoemReference(null)
      const roomFourAudio = roomFourAudioRef.current
      if (activeRoom === 'poem-answers' && roomFourAudio && !isMuted) {
        roomFourAudio.play().catch(() => {})
        fadePoemReferenceAudio(roomFourAudio, 0.12, 900)
      }
    }
  }

  const handlePoemReferenceClick = (referenceNumber) => {
    const existingAudio = poemReferenceAudioRefs.current[referenceNumber]

    if (activePoemReference === referenceNumber && existingAudio) {
      fadePoemReferenceAudio(existingAudio, 0, 650, true)
      setActivePoemReference(null)
      const roomFourAudio = roomFourAudioRef.current
      if (roomFourAudio && !isMuted) {
        roomFourAudio.play().catch(() => {})
        fadePoemReferenceAudio(roomFourAudio, 0.12, 900)
      }
      return
    }

    stopAllPoemReferenceAudio(referenceNumber)
    const roomFourAudio = roomFourAudioRef.current
    if (roomFourAudio) fadePoemReferenceAudio(roomFourAudio, 0, 650)
    const audio = existingAudio || new Audio(`/audio/door4/${referenceNumber}.mp3`)
    audio.loop = false
    audio.preload = 'auto'
    audio.volume = 0
    audio.currentTime = 0
    audio.onerror = () => {
      setActivePoemReference((currentReference) => (
        currentReference === referenceNumber ? null : currentReference
      ))
      if (roomFourAudio && !isMuted) {
        roomFourAudio.play().catch(() => {})
        fadePoemReferenceAudio(roomFourAudio, 0.12, 900)
      }
    }
    audio.onended = () => {
      setActivePoemReference((currentReference) => (
        currentReference === referenceNumber ? null : currentReference
      ))
      if (roomFourAudio && !isMuted) {
        roomFourAudio.play().catch(() => {})
        fadePoemReferenceAudio(roomFourAudio, 0.12, 1200)
      }
    }
    poemReferenceAudioRefs.current[referenceNumber] = audio
    setActivePoemReference(referenceNumber)
    audio.load()
    audio.play().catch(() => {
      setActivePoemReference(null)
      if (roomFourAudio && !isMuted) {
        roomFourAudio.play().catch(() => {})
        fadePoemReferenceAudio(roomFourAudio, 0.12, 900)
      }
    })
    fadePoemReferenceAudio(audio, isMuted ? 0 : 0.82, 1000)
  }

  const renderDoorFourLine = (line, keyPrefix) => {
    const parts = line.split(/(\[\d+\])/g)
    return parts.map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/)
      if (!match) {
        return part.split(/(\b(?:you|You|her|Her|she|She)\b)/g).map((wordPart, wordIndex) => (
          /^(?:you|You|her|Her|she|She)$/.test(wordPart) ? (
            <span key={`${keyPrefix}-${index}-${wordIndex}`} className="door-four-her-word">{wordPart}</span>
          ) : (
            <span key={`${keyPrefix}-${index}-${wordIndex}`}>{wordPart}</span>
          )
        ))
      }
      const referenceNumber = Number(match[1])
      return (
        <button
          key={`${keyPrefix}-${index}`}
          type="button"
          className={`door-four-reference ${activePoemReference === referenceNumber ? 'active' : ''}`}
          onClick={() => handlePoemReferenceClick(referenceNumber)}
          aria-label={`Play poem response ${referenceNumber}`}
          aria-pressed={activePoemReference === referenceNumber}
        >
          <span className="door-four-reference-note">♪</span>
          <span className="door-four-reference-number">{referenceNumber}</span>
          <span className="door-four-reference-fall" aria-hidden="true">
            <span>♪</span>
            <span>♡</span>
            <span>♫</span>
          </span>
        </button>
      )
    })
  }

  const renderDoorFourMusicSymbols = (side) => {
    const symbols = ['♪', '♫', '♩', '♬', '𝄞']
    const colors = ['#6b1f35', '#7a2740', '#8b2f4a', '#3f2b25', '#b89455', '#c8aa85', '#b98b8f']
    const count = 112
    return Array.from({ length: count }, (_, i) => {
      const seed = side === 'left' ? i : i + 97
      const sizeOptions = [14, 18, 24, 32, 40, 52, 60, 84]
      const usableHeight = Math.max(1, doorFourSymbolHeight - 160)
      return (
        <span
          key={`${side}-${i}`}
          className="door-four-floating-symbol"
          style={{
            '--top': `${48 + (i / (count - 1)) * usableHeight + ((seed * 29) % 90 - 45)}px`,
            '--x': `${10 + ((seed * 53) % 80)}%`,
            '--size': `${sizeOptions[seed % sizeOptions.length]}px`,
            '--symbol-color': colors[seed % colors.length],
            '--symbol-opacity': `${0.12 + ((seed * 17) % 38) / 100}`,
            '--duration': `${[6, 9, 14, 20][seed % 4] + (seed % 5) * 0.7}s`,
            '--delay': `${-(seed % 17) * 0.55}s`,
            '--drift': `${side === 'left' ? 1 : -1}`,
            '--sway': `${4 + (seed % 9) * 5}px`,
            '--rise': `${8 + (seed % 8) * 7}px`,
            '--blur': `${(seed % 5) * 0.32}px`,
            '--rotate': `${((seed % 11) - 5) * 5}deg`,
          }}
        >
          {symbols[seed % symbols.length]}
        </span>
      )
    })
  }

  return (
    <div className="museum-experience" data-theme={theme}>
      <div className="museum-aurora" aria-hidden="true" />
      <div className="museum-dust" aria-hidden="true">
        {Array.from({ length: 34 }, (_, i) => (
          <span key={i} style={{ '--i': i, left: `${(i * 29) % 100}%`, top: `${(i * 47) % 100}%` }} />
        ))}
      </div>

      <header className="museum-topbar">
        {embedded && onClose ? (
          <button type="button" className="museum-close" onClick={onClose}>Close</button>
        ) : (
          <Link className="museum-close" to="/world">Return to World</Link>
        )}
      </header>
      <button
        type="button"
        className="museum-audio-toggle"
        onClick={() => setIsMuted((muted) => !muted)}
        aria-label={isMuted ? 'Unmute museum music' : 'Mute museum music'}
        aria-pressed={isMuted}
      >
        {isMuted ? '♪' : '♫'}
      </button>

      {!activeRoom ? (
        <section className="museum-hall" aria-label="Museum hallway with seven memory doors">
          <div className="museum-ceiling" aria-hidden="true">
            <span className="museum-oculus" />
            <span className="museum-balcony-ring" />
            <span className="museum-chandelier" />
          </div>
          <div className="museum-architecture" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => <span key={i} />)}
          </div>
          <div className="museum-hall-depth" aria-hidden="true" />
          <div className="museum-floor" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
          </div>
          <div className="museum-light-rays" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="museum-centerpiece" aria-hidden="true">
            <span className="museum-star-heart" />
            <span className="museum-orbit museum-orbit-one" />
            <span className="museum-orbit museum-orbit-two" />
          </div>
          <div className="museum-countdown" aria-label="Countdown to Maram birthday, EEST">
            <p>almost May 29</p>
            <b>waiting for her birthday</b>
            <div>
              <span><strong>{countdown.days}</strong><em>days</em></span>
              <span><strong>{countdown.hours}</strong><em>hours</em></span>
              <span><strong>{countdown.minutes}</strong><em>minutes</em></span>
              <span><strong>{countdown.seconds}</strong><em>seconds</em></span>
            </div>
          </div>
          <div className="museum-doors">
            {museumDoors.map((door, i) => (
              <button
                key={i}
                type="button"
                className={`museum-door museum-door-${door.tone} ${door.unlocked ? 'unlocked' : 'locked'} ${i === museumDoors.length - 1 ? 'final-door' : ''}`}
                onClick={() => {
                  if (!door.unlocked) return
                  setRoomProgress(0)
                  setSelectedBalloonNote(null)
                  setActivePoemReference(null)
                  setHasSeenDoorFourEnding(false)
                  warmRoomAudio(door.roomId)
                  setActiveRoom(door.roomId)
                }}
                aria-label={door.unlocked ? `Enter ${door.title}` : 'Locked memory door'}
              >
                <span className="museum-door-niche" />
                <span className="museum-door-interior" />
                <span className="museum-door-number">{String(i + 1).padStart(2, '0')}</span>
                <span className="museum-door-glow" />
                <span className="museum-door-symbol">{door.symbol}</span>
                <span className="museum-door-handle" />
                <span className="museum-door-threshold" />
                <span className="museum-door-lock">{door.unlock}</span>
                <span className="museum-door-room-particles" />
                {!door.unlocked && <span className="museum-door-seal" />}
              </button>
            ))}
          </div>
        </section>
      ) : activeRoom === 'before-you' ? (
        <section
          ref={roomRef}
          className="before-you-room"
          aria-label="Before You room"
          onScroll={updateRoomProgress}
          style={{ '--room-progress': roomProgress }}
        >
          <button type="button" className="museum-back" onClick={() => setActiveRoom(null)}>Back to hallway</button>
          <div className="before-you-room-architecture" aria-hidden="true">
            <span className="before-you-sun" />
            <span className="before-you-floor" />
            <span className="before-you-bench before-you-bench-left" />
            <span className="before-you-flower-line" />
            <span className="before-you-note before-you-note-one" />
            <span className="before-you-note before-you-note-two" />
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="before-you-petal" style={{ '--i': i }} />
            ))}
          </div>
          <div className="before-you-room-title">
            <p>Room 01</p>
            <h2>Before You</h2>
            <span>A quiet room for the life before your name arrived.</span>
          </div>

          <div className="before-you-poem-room">
            <div className="before-you-poem-wall" aria-label="Before You poem">
              {beforeYouPoem.split('\n\n').map((stanza, i) => (
                <p key={i}>
                  {stanza.split('\n').map((line, lineIndex) => (
                    <span key={lineIndex}>{line}</span>
                  ))}
                </p>
              ))}
            </div>
            <div className="before-you-signature" aria-label="Museum signatures">
              <span>your lover forever,</span>
              <strong>Mahmoud</strong>
            </div>
          </div>
        </section>
      ) : activeRoom === 'balloon-notes' ? (
        <section
          ref={roomRef}
          className={`balloon-notes-room ${selectedBalloonNote ? 'has-open-note' : ''}`}
          aria-label="Room II floating balloon notes"
          onScroll={updateRoomProgress}
          style={{ '--room-progress': roomProgress }}
        >
          <button type="button" className="museum-back" onClick={() => setActiveRoom(null)}>Back to hallway</button>
          <div className="balloon-room-architecture" aria-hidden="true">
            <span className="balloon-room-sun" />
            <span className="balloon-room-floor" />
            <span className="balloon-room-flowers" />
          </div>
          <div className="balloon-room-title">
            <p>Room 02</p>
            <h2>Little Things</h2>
            <span>Things I love about you.</span>
            <em>Scroll down and click any note to read it.</em>
          </div>
          <div className="balloon-notes-field" style={{ height: `calc(${balloonNotes.length * 28}vh + 115vh)` }}>
            {balloonNotes.map((note, i) => (
              <button
                key={`${note.slice(0, 24)}-${i}`}
                type="button"
                className="balloon-note"
                style={getBalloonStyle(i)}
                onClick={() => setSelectedBalloonNote(note)}
                aria-label={`Open note ${i + 1}`}
              >
                <span className={`balloon-cluster balloon-cluster-${getBalloonCount(note)}`}>
                  {Array.from({ length: getBalloonCount(note) }, (_, balloonIndex) => (
                    <span key={balloonIndex} className="balloon-shape" style={{ '--balloon-index': balloonIndex }} />
                  ))}
                </span>
                <span className={`balloon-string balloon-string-${getBalloonCount(note)}`} />
                <span className="balloon-paper">{note}</span>
              </button>
            ))}
            <div className="balloon-goodbye" aria-label="Final Room II note">
              <span className="balloon-goodbye-shape" />
              <span className="balloon-goodbye-string" />
              <span className="balloon-goodbye-paper">
                I’ve officially run out of balloons…
                <br />
                see you tomorrow ♡
              </span>
            </div>
          </div>
        </section>
      ) : activeRoom === 'rule-of-three' ? (
        <section
          ref={roomRef}
          className="rule-three-room"
          aria-label="Room III, The Rule of Three"
          onScroll={updateRoomProgress}
          style={{ '--room-progress': roomProgress }}
        >
          <button type="button" className="museum-back" onClick={() => setActiveRoom(null)}>Back to hallway</button>
          <div className="rule-three-architecture" aria-hidden="true">
            <span className="rule-three-light rule-three-light-one" />
            <span className="rule-three-light rule-three-light-two" />
            <span className="rule-three-light rule-three-light-three" />
            <span className="rule-three-floor" />
            <span className="rule-three-ceiling-cut rule-three-ceiling-one" />
            <span className="rule-three-ceiling-cut rule-three-ceiling-two" />
            <span className="rule-three-ceiling-cut rule-three-ceiling-three" />
            <span className="rule-three-flower rule-three-flower-one" />
            <span className="rule-three-flower rule-three-flower-two" />
            <span className="rule-three-flower rule-three-flower-three" />
          </div>

          <div className="rule-three-title">
            <p>Room 03</p>
            <h2>The Rule of Three</h2>
            <span>The world hides its strongest things in threes.</span>
          </div>

          <div className="rule-three-axis" aria-label="Past, future, and present frames">
            {ruleOfThreeFrames.map((frame, index) => (
              <article key={frame.id} className={`rule-three-frame rule-three-frame-${frame.id}`} style={{ '--frame-index': index }}>
                <div className="rule-three-frame-shell">
                  <div className="rule-three-frame-inner">
                    {frame.image ? (
                      <img src={frame.image} alt={frame.alt} loading="lazy" />
                    ) : (
                      <div className="rule-three-future-canvas" aria-label="An illuminated empty frame for the future">
                        <span className="future-reflection" />
                        <span className="future-sketch future-sketch-one" />
                        <span className="future-sketch future-sketch-two" />
                        <span className="future-sketch future-sketch-three" />
                        <span className="future-moving-light" />
                        <span className="future-dust future-dust-one" />
                        <span className="future-dust future-dust-two" />
                        <span className="future-dust future-dust-three" />
                        <span className="future-dust future-dust-four" />
                        <span className="future-dust future-dust-five" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="rule-three-frame-caption">
                  <strong>{frame.title}</strong>
                  <span>{frame.subtitle}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="rule-three-poem" aria-label="Room III poem">
            {ruleOfThreePoem.split('\n\n').map((stanza, index) => (
              <p key={index} style={{ '--line-index': index }}>
                {stanza.split('\n').map((line, lineIndex) => (
                  <span key={lineIndex}>{line}</span>
                ))}
              </p>
            ))}
          </div>

          <div className="rule-three-ending">
            <span>Past</span>
            <span>Present</span>
            <span>Future</span>
            <strong>The rest stays open.</strong>
          </div>
        </section>
      ) : activeRoom === 'arafah' ? (
        <section className="arafah-room" aria-label="Room V, Arafah">
          <button type="button" className="museum-back arafah-back" onClick={() => setActiveRoom(null)}>Back to hallway</button>
          <ArafahRoomScene />
        </section>
      ) : activeRoom === 'adventure-book' ? (
        <section className="adventure-book-room" aria-label="Room VI, 100 Years of Adventure">
          <button type="button" className="museum-back adventure-back" onClick={() => setActiveRoom(null)}>Back to hallway</button>
          <AdventureBookRoom />
        </section>
      ) : (
        <section
          ref={roomRef}
          className={`door-four-room ${activePoemReference ? 'has-speaking-reference' : ''}`}
          aria-label="Room IV, The Poem That Answers Back"
          onScroll={updateRoomProgress}
          style={{ '--room-progress': roomProgress }}
        >
          <button type="button" className="museum-back door-four-back" onClick={() => setActiveRoom(null)}>Back to hallway</button>
          <div
            className="door-four-symbol-field music-symbols-left"
            style={{ height: `${doorFourSymbolHeight}px` }}
            aria-hidden="true"
          >
            {renderDoorFourMusicSymbols('left')}
          </div>
          <div
            className="door-four-symbol-field music-symbols-right"
            style={{ height: `${doorFourSymbolHeight}px` }}
            aria-hidden="true"
          >
            {renderDoorFourMusicSymbols('right')}
          </div>
          <div className="door-four-architecture" aria-hidden="true">
            <span className="door-four-shadow door-four-shadow-one" />
            <span className="door-four-shadow door-four-shadow-two" />
            <span className="door-four-wall-curve door-four-wall-curve-left" />
            <span className="door-four-wall-curve door-four-wall-curve-right" />
            <span className="door-four-lamp door-four-lamp-one" />
            <span className="door-four-lamp door-four-lamp-two" />
            <span className="door-four-lamp door-four-lamp-three" />
            <span className="door-four-table-light" />
            <span className="door-four-bridge-light" />
            <span className="door-four-ceiling-wave door-four-ceiling-wave-one" />
            <span className="door-four-ceiling-wave door-four-ceiling-wave-two" />
            <span className="door-four-ceiling-wave door-four-ceiling-wave-three" />
            <span className="door-four-suspended-lines" />
            <span className="door-four-floor-resonance">
              {Array.from({ length: 6 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
            </span>
            <span className="door-four-sound-thread door-four-sound-thread-one" />
            <span className="door-four-sound-thread door-four-sound-thread-two" />
            <span className="door-four-sound-thread door-four-sound-thread-three" />
            <span className="door-four-resonance door-four-resonance-one" />
            <span className="door-four-resonance door-four-resonance-two" />
            <span className="door-four-resonance door-four-resonance-three" />
            {Array.from({ length: 28 }, (_, i) => (
              <span key={i} className="door-four-dust" style={{ '--i': i }} />
            ))}
          </div>

          <div className="door-four-title">
            <p>Room 04</p>
            <h2>The Poem That Answers Back</h2>
            <span>Click the quiet numbers. Let the poem answer.</span>
          </div>

          <article className="door-four-manuscript" aria-label="The Poem That Answers Back poem">
            {doorFourPoem.split('\n\n').map((stanza, stanzaIndex) => {
              const isActive = activePoemReference != null && stanza.includes(`[${activePoemReference}]`)
              return (
                <p
                  key={stanzaIndex}
                  className={`door-four-stanza-${stanzaIndex % 5} ${isActive ? 'active-stanza' : ''}`}
                  style={{ '--stanza-index': stanzaIndex }}
                >
                  {stanza.split('\n').map((line, lineIndex) => (
                    <span key={lineIndex} className={line.includes(`[${activePoemReference}]`) ? 'active-line' : ''}>
                      {renderDoorFourLine(line, `${stanzaIndex}-${lineIndex}`)}
                    </span>
                  ))}
                </p>
              )
            })}
          </article>

          <div ref={doorFourEndingRef} className={`door-four-ending ${hasSeenDoorFourEnding ? 'revealed' : ''}`}>
            <span>Some poems are meant to be heard.</span>
          </div>
        </section>
      )}
      {selectedBalloonNote && (
        <div className="balloon-note-modal" role="dialog" aria-modal="true" aria-label="Opened balloon note">
          <button type="button" className="balloon-note-backdrop" onClick={() => setSelectedBalloonNote(null)} aria-label="Close note" />
          <article className="balloon-note-expanded">
            <button type="button" className="balloon-note-close" onClick={() => setSelectedBalloonNote(null)}>Close</button>
            <p>{selectedBalloonNote}</p>
          </article>
        </div>
      )}
    </div>
  )
}

function getMuseumCountdown() {
  // May 29, 2026 at 12:00 AM in UTC+3/EEST is May 28, 21:00 UTC.
  const targetTime = Date.UTC(2026, 4, 28, 21, 0, 0)
  const totalSeconds = Math.max(0, Math.floor((targetTime - Date.now()) / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}
