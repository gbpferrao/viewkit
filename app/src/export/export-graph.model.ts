import type { ProjectSnapshot } from '../timeline/project-timeline.state';
import type { MediaSource } from '../timeline/timeline.model';
import { renderOrder, timelineEnd } from '../timeline/timeline.model';
import { videoWorldSize } from '../stage/stage-size.model';

export function buildExportCommand(snapshot: ProjectSnapshot, sources: MediaSource[], audioSources: Map<string, number>) {
  const { stage } = snapshot;
  const duration = timelineEnd(snapshot.clips);
  const ordered = renderOrder(snapshot.clips);
  const inputs: string[] = [], filters: string[] = [];
  const decimal = (value: number) => value.toFixed(6);
  const sourceById = new Map(sources.map(source => [source.id, source]));
  const filenameById = new Map(sources.map((source, index) => [source.id, 'source-' + index + '.' + source.file.name.split('.').at(-1)?.toLowerCase()]));
  for (const clip of ordered) {
    // Input seeking lets the decoder skip unused footage before each trim. Transcoding retains accurate seeking.
    inputs.push('-ss', decimal(clip.offset), '-t', decimal(clip.duration), '-i', filenameById.get(clip.sourceId)!);
  }
  filters.push('color=c=black:s=' + stage.width + 'x' + stage.height + ':r=24:d=' + decimal(duration) + ',format=rgba[base]');
  filters.push('anullsrc=r=48000:cl=stereo,atrim=duration=' + decimal(duration) + '[silence]');
  let video = 'base';
  const audio = ['silence'];
  ordered.forEach((clip, index) => {
    const source = sourceById.get(clip.sourceId)!;
    if (source.kind === 'video') {
      const size = videoWorldSize(source), transform = clip.transform;
      const width = Math.max(2, Math.round(size.width * transform.scaleX));
      const height = Math.max(2, Math.round(size.height * transform.scaleY));
      const rotation = decimal(transform.rotation * Math.PI / 180);
      const scaling = width === source.width && height === source.height ? '' : ',scale=' + width + ':' + height;
      const rotating = transform.rotation % 360 === 0 ? '' : ',rotate=' + rotation + ':ow=rotw(' + rotation + '):oh=roth(' + rotation + '):c=none';
      filters.push('[' + index + ':v]trim=duration=' + decimal(clip.duration) +
        ',setpts=PTS-STARTPTS,fps=24,setpts=PTS+' + decimal(clip.start) + '/TB' + scaling +
        ',format=rgba' + rotating + '[v' + index + ']');
      const next = 'layer' + index;
      filters.push('[' + video + '][v' + index + ']overlay=x=(W-w)/2+' + decimal(transform.x) +
        ':y=(H-h)/2+' + decimal(transform.y) + ':eof_action=pass:repeatlast=0:enable=\'gte(t,' +
        decimal(clip.start) + ')*lt(t,' + decimal(clip.start + clip.duration) + ')\'[' + next + ']');
      video = next;
    }
    if (audioSources.has(source.id)) {
      const label = 'audio' + index;
      const channelMapping = audioSources.get(source.id) === 1 ? ',pan=stereo|c0=c0|c1=c0' : '';
      filters.push('[' + index + ':a]atrim=duration=' + decimal(clip.duration) +
        ',asetpts=PTS-STARTPTS' + channelMapping + ',volume=' + decimal(clip.volume / 100) + ',adelay=' +
        Math.round(clip.start * 1000) + ':all=1[' + label + ']');
      audio.push(label);
    }
  });
  const oddSize = stage.width % 2 !== 0 || stage.height % 2 !== 0;
  filters.push('[' + video + ']format=' + (oddSize ? 'yuv444p' : 'yuv420p') + '[video]');
  filters.push(audio.map(label => '[' + label + ']').join('') + 'amix=inputs=' + audio.length +
    ':duration=longest:normalize=0,atrim=duration=' + decimal(duration) + '[audio]');
  const codec = ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20'];
  return [...inputs, '-filter_complex', filters.join(';'), '-map', '[video]', '-map', '[audio]',
    ...codec, '-c:a', 'aac', '-b:a', '192k', '-r', '24', '-t', decimal(duration),
    '-threads', '1', '-movflags', '+faststart', '-y', 'output.mp4'];
}
