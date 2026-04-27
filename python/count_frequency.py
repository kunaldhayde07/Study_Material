# Write a program to count frequency of each character

text = "banana"
freq = {}

for ch in text:
    if ch in freq:
        freq[ch] += 1
    else:
        freq[ch] = 1
print(freq)


# Output:
# {'b': 1, 'a': 3, 'n': 2}
