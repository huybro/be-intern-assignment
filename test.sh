#!/bin/bash

# Base URLs
BASE_URL="http://localhost:3000/api"
USERS_URL="$BASE_URL/users"
POSTS_URL="$BASE_URL/posts"
AUTH_URL="$BASE_URL/auth"
FEED_URL="$BASE_URL/feed"
FOLLOW_URL="$BASE_URL/follows"
LIKES_URL="$BASE_URL/likes"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Global token variable
TOKEN=""

# Function to print section headers
print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3

    echo "Request: $method $endpoint"
    if [ -n "$data" ]; then
        echo "Data: $data"
    fi

    if [ "$method" = "GET" ]; then
        response=$(curl -s -X $method "$endpoint" -H "Authorization: Bearer $TOKEN")
    else
        response=$(curl -s -X $method "$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    fi

    # Check if API returned an error
    error_message=$(echo "$response" | jq -r '.message // empty')
    if [ -n "$error_message" ]; then
        echo -e "${RED}API Error: $error_message${NC}"
    else
        echo "$response" | jq .
    fi
    echo ""
}

# Function to register a user
register_user() {
    print_header "Register a new user"
    read -p "First name: " firstName
    read -p "Last name: " lastName
    read -p "Email: " email
    read -p "Password: " password


    local user_data=$(cat <<EOF
{
    "firstName": "$firstName",
    "lastName": "$lastName",
    "email": "$email",
    "password": "$password"
}
EOF
)

    # Proper curl call: capture both body and status
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/register" -H "Content-Type: application/json" -d "$user_data")
    body=$(echo "$response" | sed '$d')
    status=$(echo "$response" | tail -n1)

    if [ "$status" -ge 400 ]; then
        # Error happened
        error_message=$(echo "$body" | jq -r '.message // "Unknown error"')
        echo -e "${RED}Registration failed: $error_message${NC}"
    else
        # Success
        echo -e "${GREEN}Registration successful!${NC}"
    fi
}

# Function to login and get token
login_user() {
    print_header "Login"
    read -p "Email: " email
    read -p "Password: " password

    local login_data=$(cat <<EOF
{
    "email": "$email",
    "password": "$password"
}
EOF
)
    response=$(curl -s -X POST "$AUTH_URL/login" -H "Content-Type: application/json" -d "$login_data")
    error=$(echo "$response" | jq -r '.message')
    TOKEN=$(echo "$response" | jq -r '.token')

    if [ "$error" != "null" ]; then
        echo -e "${RED}Login failed: $error${NC}"
        TOKEN=""
    elif [ "$TOKEN" = "null" ]; then
        echo -e "${RED}Login failed. Check your credentials.${NC}"
        TOKEN=""
    else
        echo -e "${GREEN}Login successful!${NC}"
        echo "Token: $TOKEN"  # ✅ Print the token to stdout
    fi
}

#########################
# User-related functions
#########################
test_get_all_users() {
    print_header "Testing GET all users"
    make_request "GET" "$USERS_URL"
}

test_get_user() {
    print_header "Testing GET user by ID"
    read -p "Enter user ID: " user_id
    make_request "GET" "$USERS_URL/$user_id"
}

test_create_user() {
    register_user
}

test_update_user() {
    print_header "Testing PUT update user"
    read -p "New first name: " firstName
    read -p "New last name: " lastName
    read -p "New email: " email

    local update_data=$(cat <<EOF
{
    "firstName": "$firstName",
    "lastName": "$lastName",
    "email": "$email"
}
EOF
)
    make_request "PUT" "$USERS_URL/me" "$update_data"
}

test_delete_user() {
    print_header "Testing DELETE user"
    read -p "User ID to delete: " user_id
    make_request "DELETE" "$USERS_URL/$user_id"
}

#########################
# Post-related functions
#########################
test_create_post() {
    print_header "Testing POST create post (auth required)"
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Error: You must login first.${NC}"
        return
    fi

    read -p "Post content: " content
    read -p "Hashtags (comma-separated): " hashtags

    # Format hashtags into JSON array
    local hashtags_json="[]"
    if [ -n "$hashtags" ]; then
        hashtags_json=$(echo "$hashtags" | awk -F',' '{ 
            printf "["; 
            for (i=1; i<=NF; i++) { 
                gsub(/^[ \t]+|[ \t]+$/, "", $i); 
                printf "\"" $i "\""; 
                if (i < NF) printf "," 
            } 
            printf "]"
        }')
    fi

    local post_data=$(cat <<EOF
{
    "content": "$content",
    "hashtags": $hashtags_json
}
EOF
)

    make_request "POST" "$POSTS_URL" "$post_data"
}

test_get_feed() {
    print_header "Testing GET user feed"
    read -p "Limit (default 10): " limit
    read -p "Offset (default 0): " offset

    local url="$FEED_URL?limit=${limit:-10}&offset=${offset:-0}"
    echo -e "\nRequest: GET $url"

    response=$(curl -s -X GET "$url" \
        -H "Authorization: Bearer $TOKEN")

    # Try parsing response with jq
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo "$response" | jq .
    else
        echo -e "${RED}Non-JSON or Error Response:${NC}"
        echo "$response"
    fi
}

test_get_posts_by_hashtag() {
    print_header "Testing GET posts by hashtag"
    read -p "Hashtag (without #): " tag
    read -p "Limit (default 10): " limit
    read -p "Offset (default 0): " offset
    make_request "GET" "$POSTS_URL/hashtag/$tag?limit=${limit:-10}&offset=${offset:-0}"
}

#########################
# Followers-related functions
#########################
test_get_followers() {
    print_header "Testing GET user's followers"
    read -p "User ID: " user_id
    read -p "Limit (default 10): " limit
    read -p "Offset (default 0): " offset
    make_request "GET" "$USERS_URL/$user_id/followers?limit=${limit:-10}&offset=${offset:-0}"
}

# Function to validate activity type
validate_activity_type() {
    local type=$1
    local valid_types=("post" "like" "follow" "unfollow")
    for valid_type in "${valid_types[@]}"; do
        if [ "$type" = "$valid_type" ]; then
            return 0
        fi
    done
    return 1
}

# Function to validate date format
validate_date() {
    local date=$1
    if [[ $date =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        return 0
    else
        return 1
    fi
}

test_user_activity() {
    print_header "Testing GET user's activity history"

    read -p "Enter user ID: " user_id
    read -p "Limit (default 10): " limit
    read -p "Offset (default 0): " offset
    
    while true; do
        read -p "Activity type (optional: post, like, follow, unfollow): " type
        if [ -z "$type" ] || validate_activity_type "$type"; then
            break
        else
            echo -e "${RED}Invalid activity type. Please enter one of: post, like, follow, unfollow${NC}"
        fi
    done

    while true; do
        read -p "Start Date (optional, format YYYY-MM-DD): " startDate
        if [ -z "$startDate" ] || validate_date "$startDate"; then
            break
        else
            echo -e "${RED}Invalid date format. Please use YYYY-MM-DD${NC}"
        fi
    done

    while true; do
        read -p "End Date (optional, format YYYY-MM-DD): " endDate
        if [ -z "$endDate" ] || validate_date "$endDate"; then
            break
        else
            echo -e "${RED}Invalid date format. Please use YYYY-MM-DD${NC}"
        fi
    done

    # Validate date range
    if [ -n "$startDate" ] && [ -n "$endDate" ]; then
        if [ "$startDate" \> "$endDate" ]; then
            echo -e "${RED}Start date must be before end date${NC}"
            return
        fi
    fi

    # Build query string
    query="limit=${limit:-10}&offset=${offset:-0}"

    if [ -n "$type" ]; then
        query+="&type=$type"
    fi

    if [ -n "$startDate" ] && [ -n "$endDate" ]; then
        query+="&startDate=$startDate&endDate=$endDate"
    fi

    # Call the API
    response=$(make_request "GET" "$USERS_URL/$user_id/activity?$query")
    
    # Check if response contains error
    if echo "$response" | grep -q "error"; then
        echo -e "${RED}Error occurred while fetching activities${NC}"
    else
        echo "$response"
    fi
}

test_like_post() {
    print_header "Testing POST like a post"
    read -p "Post ID to like: " post_id

    echo -e "\nRequest: POST $LIKES_URL/$post_id"
    response=$(curl -s -X POST "$LIKES_URL/$post_id" \
        -H "Authorization: Bearer $TOKEN")

    if echo "$response" | jq . >/dev/null 2>&1; then
        echo "$response" | jq .
    else
        echo -e "${RED}Non-JSON or Error Response:${NC}"
        echo "$response"
    fi
}

test_unlike_post() {
    print_header "Testing DELETE unlike a post"
    read -p "Post ID to unlike: " post_id

    echo -e "\nRequest: DELETE $LIKES_URL/$post_id"
    response=$(curl -s -X DELETE "$LIKES_URL/$post_id" \
        -H "Authorization: Bearer $TOKEN")

    if [ -z "$response" ]; then
        echo -e "${GREEN}Successfully unliked post $post_id${NC}"
    elif echo "$response" | jq . >/dev/null 2>&1; then
        echo "$response" | jq .
    else
        echo -e "${RED}Non-JSON or Error Response:${NC}"
        echo "$response"
    fi
}

test_follow_user() {
    print_header "Testing POST follow a user"
    read -p "User ID to follow: " following_id

    local follow_data=$(cat <<EOF
{
    "followingId": $following_id
}
EOF
)

    echo -e "\nRequest: POST $FOLLOW_URL"
    echo -e "Data: $follow_data"

    response=$(make_request "POST" "$FOLLOW_URL" "$follow_data")
    echo -e "Response:\n$response"
}

test_unfollow_user() {
    print_header "Testing DELETE unfollow a user"
    read -p "User ID to unfollow: " following_id

    local unfollow_url="$FOLLOW_URL/$following_id"

    echo -e "\nRequest: DELETE $unfollow_url"

    response=$(make_request "DELETE" "$unfollow_url" "")
    echo -e "Response:\n$response"
}

#########################
# Menus
#########################
show_auth_menu() {
    echo -e "\n${GREEN}Auth Menu${NC}"
    echo "1. Register"
    echo "2. Login"
    echo "3. Back to main menu"
    echo -n "Enter your choice (1-3): "
}

show_users_menu() {
    echo -e "\n${GREEN}Users Menu${NC}"
    echo "1. Get all users"
    echo "2. Get user by ID"
    echo "3. Update user"
    echo "4. Delete user"
    echo "5. Get user's followers"
    echo "6. View user's activity history"
    echo "7. Follow a user"
    echo "8. Unfollow a user"
    echo "9. Back to main menu"
    echo -n "Enter your choice (1-9): "
}

show_posts_menu() {
    echo -e "\n${GREEN}Posts Menu${NC}"
    echo "1. Create post"
    echo "2. Get user feed"
    echo "3. Get posts by hashtag"
    echo "4. Like a post"
    echo "5. Unlike a post"
    echo "6. Back to main menu"
    echo -n "Enter your choice (1-6): "
}

show_main_menu() {
    echo -e "\n${GREEN}API Testing Main Menu${NC}"
    echo "1. Authentication"
    echo "2. Users"
    echo "3. Posts"
    echo "4. Exit"
    echo -n "Enter your choice (1-4): "
}

#########################
# Main loop
#########################
while true; do
    show_main_menu
    read choice
    case $choice in
        1)
            while true; do
                show_auth_menu
                read auth_choice
                case $auth_choice in
                    1) register_user ;;
                    2) login_user ;;
                    3) break ;;
                    *) echo "Invalid choice. Try again." ;;
                esac
            done
            ;;
        2)
            while true; do
                show_users_menu
                read user_choice
                case $user_choice in
                    1) test_get_all_users ;;
                    2) test_get_user ;;
                    3) test_update_user ;;
                    4) test_delete_user ;;
                    5) test_get_followers ;;
                    6) test_user_activity ;;
                    7) test_follow_user ;;
                    8) test_unfollow_user ;;
                    9) break ;;
                    *) echo "Invalid choice. Try again." ;;
                esac
            done
            ;;
        3)
            while true; do
                show_posts_menu
                read post_choice
                case $post_choice in
                    1) test_create_post ;;
                    2) test_get_feed ;;
                    3) test_get_posts_by_hashtag ;;
                    4) test_like_post ;;
                    5) test_unlike_post ;;
                    6) break ;;
                    *) echo "Invalid choice. Try again." ;;
                esac
            done
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Try again."
            ;;
    esac
done