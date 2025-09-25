import React from "react";

export default function RecentPostsList({ posts, onPostClick }) {
	return (
		<div className="space-y-4">
			{posts
				.filter(
					(post) => post.userL_name === "Faculty" || post.userL_name === "Admin"
				)
				.map((post) => (
					<button
						key={post.post_id}
						onClick={() => onPostClick(post)}
						className="w-full text-left p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200 dark:bg-[#3f3f3f] dark:hover:bg-gray-600"
					>
						<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
							<span className="font-medium text-gray-800 dark:text-gray-200">
								{post.user_name}
							</span>{" "}
							post about "{post.post_caption}"
						</p>
					</button>
				))}
		</div>
	);
}
