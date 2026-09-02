import os
import subprocess
import shutil
import imageio_ffmpeg as ffmpeg

ffmpeg_exe = ffmpeg.get_ffmpeg_exe()
v1 = r'D:\heygen\z assests\flow-0c2dfea4-6574-4ea6-809b--erasio - Copy.mp4'
v2 = r'D:\heygen\z assests\flow-9fe97276-30dd-410c-8c8e--erasio.mp4'

proj_dir = r'C:\Users\rv941\.gemini\antigravity-ide\scratch\the-last-garden'
assets_dir = os.path.join(proj_dir, 'public', 'assets')
frames_opt_dir = os.path.join(proj_dir, 'public', 'frames_opt')

os.makedirs(assets_dir, exist_ok=True)
os.makedirs(frames_opt_dir, exist_ok=True)

# 1. Concat file list
concat_txt = os.path.join(proj_dir, 'concat_list.txt')
with open(concat_txt, 'w', encoding='utf-8') as f:
    f.write(f"file '{v1}'\n")
    f.write(f"file '{v2}'\n")

merged_mp4 = os.path.join(assets_dir, 'the_last_garden_extended.mp4')
print('Merging video 1 and video 2 into seamless extended cut...')
cmd_merge = [
    ffmpeg_exe, '-y',
    '-f', 'concat', '-safe', '0', '-i', concat_txt,
    '-c', 'copy',
    merged_mp4
]
subprocess.run(cmd_merge, check=True)
print('Merged MP4 created:', os.path.getsize(merged_mp4), 'bytes')

# Copy merged as default video.mp4
shutil.copyfile(merged_mp4, os.path.join(assets_dir, 'video.mp4'))

# 2. Extract full extended audio
audio_path = os.path.join(assets_dir, 'soundtrack.mp3')
print('Extracting extended audio track...')
cmd_audio = [
    ffmpeg_exe, '-y', '-i', merged_mp4,
    '-vn', '-acodec', 'libmp3lame', '-ab', '192k',
    audio_path
]
subprocess.run(cmd_audio, check=True)
print('Audio track extracted:', os.path.getsize(audio_path), 'bytes')

# 3. Clean old frames
for f in os.listdir(frames_opt_dir):
    try:
        os.remove(os.path.join(frames_opt_dir, f))
    except:
        pass

# 4. Extract all 480 optimized WebP frames (quality 68, fast loading, high detail)
print('Extracting 480 optimized WebP frames...')
cmd_frames = [
    ffmpeg_exe, '-y', '-i', merged_mp4,
    '-vcodec', 'libwebp',
    '-q:v', '68',
    '-compression_level', '4',
    os.path.join(frames_opt_dir, 'frame_%03d.webp')
]
subprocess.run(cmd_frames, check=True)
extracted = len(os.listdir(frames_opt_dir))
print(f'Extracted {extracted} optimized frames.')

# 5. Generate extended animated WebP
animated_webp = os.path.join(assets_dir, 'the_last_garden.webp')
print('Generating extended animated WebP (24 fps)...')
cmd_anim = [
    ffmpeg_exe, '-y', '-i', merged_mp4,
    '-vcodec', 'libwebp',
    '-filter:v', 'fps=24,scale=960:-1:flags=lanczos',
    '-lossless', '0', '-compression_level', '4', '-q:v', '70', '-loop', '0',
    animated_webp
]
subprocess.run(cmd_anim, check=True)
print('Animated WebP created:', os.path.getsize(animated_webp), 'bytes')
