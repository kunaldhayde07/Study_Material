# Write a program to count vowels in a string

s = "Python Programming"
count = 0

for ch in s:
    if ch in "aeiouAEIOU":
        count += 1
print("Vowels:", count)

# Output:
# Vowels: 4
