# To write a Python program to perform string processing operations such as counting words, characters, vowels, and finding a substring in a given text.

# ----------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Input string
text = input("Enter a text: ")

# Count characters (including spaces)
char_count = len(text)

# Count words
words = text.split()
word_count = len(words)

# Count vowels
vowels = "aeiouAEIOU"
vowel_count = 0
for ch in text:
    if ch in vowels:
        vowel_count += 1

# Find substring
sub = input("Enter substring to search: ")
if sub in text:
    found = "Substring found"
else:
    found = "Substring not found"

# Display results
print("\n--- String Analysis ---")
print("Number of characters:", char_count)
print("Number of words:", word_count)
print("Number of vowels:", vowel_count)
print("Substring result:", found)


# Enter a text: kunal
# Enter substring to search: n

# --- String Analysis ---
# Number of characters: 5
# Number of words: 1
# Number of vowels: 2
# Substring result: Substring found