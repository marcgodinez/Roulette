
filePath = r"c:\Users\marcg\Documents\Projects\Roulette\android-native\app\src\main\java\com\marcgodinez\roulette\ui\game\GameScreen.kt"
with open(filePath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Truncate to first 566 lines
new_lines = lines[:566]

# Check if the last line is a closing brace, if not, maybe ensure it is?
# But per my view, 566 is "        }" which should be correct.
# Just to be safe, let's print the last few lines for log
print("Last 5 lines before truncate:")
for l in new_lines[-5:]:
    print(l, end='')

with open(filePath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
